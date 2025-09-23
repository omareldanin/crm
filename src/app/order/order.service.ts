import { BadRequestException, Injectable } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { orderSelect, orderSelectReform } from "./order.response";
import { CartService } from "../cart/cart.service";
import { NotificationService } from "../notification/notification.service";
import { NotFoundError } from "rxjs";
import { startOfMonth, subMonths } from "date-fns";

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

    cart.products.forEach(async (product) => {
      if (product.category) {
        total += +product.category.price * +product.quantity;
        await this.prisma.productCategory.update({
          where: { id: product.category.id },
          data: {
            quantity: {
              decrement: product.quantity,
            },
          },
        });
        await this.prisma.product.update({
          where: { id: product.product.id },
          data: {
            orders: {
              increment: product.quantity,
            },
          },
        });
      } else {
        total += +product.product.price * +product.quantity;
        await this.prisma.product.update({
          where: { id: product.product.id },
          data: {
            quantity: {
              decrement: product.quantity,
            },
            orders: {
              increment: product.quantity,
            },
          },
        });
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
      data: {
        paidAmount: data.paidAmount ? +data.paidAmount : undefined,
        status: data.status ? data.status : undefined,
        deliveryId: data.deliveryId ? +data.deliveryId : undefined,
      },
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

  async getMonthlySales() {
    // تاريخ أول يوم من الشهر الحالي ناقص 11 شهر (يعني آخر 12 شهر)
    const startDate = startOfMonth(subMonths(new Date(), 11));

    const result = await this.prisma.order.groupBy({
      by: ["createdAt"], // Prisma بيجبرك تختار حقل date
      where: {
        createdAt: {
          gte: startDate,
        },
        deleted: false,
      },
      _sum: {
        total: true, // إجمالي المدفوع
        quantity: true,
      },
    });

    // ⚠️ groupBy بيرجعك createdAt كامل (بالثواني)، فلازم نعمل map لتجميعه حسب الشهر
    const monthly = result.reduce(
      (acc, order) => {
        const monthKey = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth() + 1}`;

        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, totalQty: 0 };
        }
        acc[monthKey].total += order._sum.total || 0;
        acc[monthKey].totalQty += order._sum.quantity || 0;

        return acc;
      },
      {} as Record<string, { total: number; totalQty: number }>
    );

    return monthly;
  }

  async getOrderStatistics(vendorId?: number, deliveryId?: number) {
    const result = await this.prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: {
        vendorId: vendorId ? +vendorId : undefined,
        deliveryId: deliveryId ? +deliveryId : undefined,
        deleted: false,
      },
    });

    const productsCount = await this.prisma.product.aggregate({
      _count: { id: true },
    });

    const products = await this.prisma.product.findMany({
      select: { name: true, orders: true },
    });

    const productsHasQuantity = await this.prisma.product.aggregate({
      _count: { id: true },
      where: { quantity: { gt: 0 } },
    });

    const productsNotHasQuantity = await this.prisma.product.aggregate({
      _count: { id: true },
      where: { quantity: 0 },
    });

    const vendorCount = await this.prisma.user.aggregate({
      _count: { id: true },
      where: { role: "VENDOR", deleted: false },
    });

    const activeDeliveries = await this.prisma.delivery.aggregate({
      _count: { id: true },
      where: { online: true, user: { deleted: false } },
    });

    const totalPaid = await this.prisma.transaction.aggregate({
      _count: { id: true },
      _sum: { paidAmount: true },
      where: {
        vendorId: vendorId ? +vendorId : undefined,
        deliveryId: deliveryId ? +deliveryId : undefined,
      },
    });

    const notConfirmed = await this.prisma.transaction.aggregate({
      _count: { id: true },
      _sum: { paidAmount: true },
      where: {
        vendorId: vendorId ? +vendorId : undefined,
        deliveryId: deliveryId ? +deliveryId : undefined,
        confirmed: false,
      },
    });

    const statuses = await this.prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
      where: {
        vendorId: vendorId ? +vendorId : undefined,
        deliveryId: deliveryId ? +deliveryId : undefined,
        deleted: false,
      },
    });

    const statusCounts: Record<string, number> = Object.values(
      OrderStatus
    ).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<string, number>
    );

    statuses.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    const monthlySales = await this.getMonthlySales();
    return {
      productsCount: productsCount._count.id || 0,
      productsHasQuantity: productsHasQuantity._count.id || 0,
      productsNotHasQuantity: productsNotHasQuantity._count.id || 0,
      totalOrders: result._count?.id || 0,
      vendorCount: vendorCount._count?.id || 0,
      activeDeliveries: activeDeliveries._count?.id || 0,
      total: result._sum?.total || 0,
      totalNotPaid:
        (result._sum?.total || 0) - (totalPaid._sum?.paidAmount || 0),
      totalPaid: totalPaid._sum?.paidAmount || 0,
      totalNotConfirmed: notConfirmed._sum?.paidAmount || 0,
      totalConfirmed:
        (totalPaid._sum?.paidAmount || 0) -
        (notConfirmed._sum?.paidAmount || 0),
      monthlySales,
      statusCounts,
      products,
    };
  }
}
