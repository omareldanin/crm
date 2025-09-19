import { BadRequestException, Injectable } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { orderSelect, orderSelectReform } from "./order.response";
import { CartService } from "../cart/cart.service";
import { NotificationService } from "../notification/notification.service";
import { NotFoundError } from "rxjs";

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private cart: CartService,
    private notification: NotificationService
  ) {}

  async getAll(params: {
    vendorId?: number;
    deliveryId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    size?: number;
    status?: OrderStatus;
  }) {
    const {
      vendorId,
      deliveryId,
      startDate,
      endDate,
      status,
      page = 1,
      size = 10,
    } = params;

    const where: Prisma.OrderWhereInput = {
      ...(vendorId ? { vendorId } : {}),
      ...(deliveryId ? { deliveryId } : {}),
      ...(status ? { status } : {}),
      ...{ deleted: false },
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: "desc" },
        select: orderSelect,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      count: total,
      totalPages: Math.ceil(total / size),
      page,
      results: data.map((order) => orderSelectReform(order)),
    };
  }

  async getOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id, deleted: false },
      select: orderSelect,
    });
    if (!order) {
      throw new BadRequestException("لم يتم العثور علي الطلب");
    }
    return {
      order: orderSelectReform(order),
    };
  }

  async create(data: { vendorId: number; notes: string; name: string }) {
    let total = 0;

    const cart = await this.cart.getUserCart(data.vendorId);

    if (cart.products.length === 0) {
      throw new BadRequestException("لا يوجد منتجات في السله");
    }

    cart.products.forEach((product) => {
      if (product.category) {
        total += +product.category.price * +product.quantity;
      } else {
        total += +product.product.price * +product.quantity;
      }
    });

    const order = await this.prisma.order.create({
      data: {
        notes: data.notes || "",
        status: "PROSSESING",
        total: total,
        quantity: cart.quantity,
        vendor: {
          connect: {
            id: data.vendorId,
          },
        },
      },
    });

    await this.prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        quantity: 0,
        subtotal: 0,
        total: 0,
      },
    });

    await this.prisma.cartProduct.updateMany({
      where: {
        cartId: cart.id,
      },
      data: {
        ordered: true,
        orderId: order.id,
        cartId: null,
      },
    });

    await this.notification.sendNotification({
      title: "طلبيه جديده",
      content: `هناك طلبيه جديده من ${data.name}`,
      topic: "ADMIN",
    });

    await this.notification.sendNotification({
      title: "طلبيه جديده",
      content: `هناك طلبيه جديده من ${data.name}`,
      topic: "ADMIN_ASSISTANT",
    });

    return { message: "success", order };
  }

  async update(
    id: number,
    data: {
      paidAmount?: number;
      status?: OrderStatus;
      deliveryId?: number;
    }
  ) {
    const order = await this.getOne(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data,
    });

    if (data.status && order.order.status !== data.status) {
      await this.notification.sendNotification({
        title: "تحديث للطلب",
        content: `تم تغيير حاله الطلب رقم ${order.order.id} إلي ${data.status === "DELEVERIED" ? "تم التسليم" : data.status === "WITH_DELIVERY" ? "بالطريق مع المندوب" : "قيد المعالجه"}`,
        topic: "ADMIN_ASSISTANT",
      });
      await this.notification.sendNotification({
        title: "تحديث للطلب",
        content: `تم تغيير حاله الطلب رقم ${order.order.id} إلي ${data.status === "DELEVERIED" ? "تم التسليم" : data.status === "WITH_DELIVERY" ? "بالطريق مع المندوب" : "قيد المعالجه"}`,
        topic: "ADMIN",
      });
      await this.notification.sendNotification({
        title: "تحديث للطلب",
        content: `تم تغيير حاله الطلب رقم ${order.order.id} إلي ${data.status === "DELEVERIED" ? "تم التسليم" : data.status === "WITH_DELIVERY" ? "بالطريق مع المندوب" : "قيد المعالجه"}`,
        userId: order.order.vendor.id,
      });
    }
    if (data.paidAmount) {
      await this.prisma.transaction.create({
        data: {
          paidAmount: +data.paidAmount,
          confirmed: false,
          delivery: {
            connect: {
              id: order.order.delivery.id,
            },
          },
          vendor: {
            connect: {
              id: order.order.vendor.id,
            },
          },
        },
      });
    }

    return { message: "success", updatedOrder };
  }

  async delete(id: number, userId: number) {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        deleted: true,
        deletedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return { message: "success" };
  }

  async getOrderStatistics(vendorId?: number) {
    const result = await this.prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: {
        vendorId: vendorId ? +vendorId : undefined,
        deleted: false,
      },
    });

    const statuses = await this.prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
      where: {
        vendorId: vendorId ? +vendorId : undefined,
        deleted: false,
      },
    });

    return {
      totalOrders: result._count?.id || 0,
      total: result._sum?.total || 0,
      statusCounts: statuses.reduce(
        (acc, s) => {
          acc[s.status] = s._count.status;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
