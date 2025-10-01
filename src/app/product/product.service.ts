import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  updateProductDto,
} from "./product.dto";

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(data: { data: CreateProductDto; userid: number }) {
    const product = await this.prisma.product.create({
      data: {
        name: data.data.name,
        price: data.data.price || 0,
        quantity: +data.data.quantity || 0,
        image: data.data.image || undefined,
        description: data.data.description,
        available: data.data.available,
        createdBy: {
          connect: {
            id: data.userid,
          },
        },
      },
    });

    if (data.data.categories && data.data.categories.length > 0) {
      await this.prisma.productCategory.createMany({
        data: data.data.categories.map((cat) => ({
          name: cat.name,
          price: cat.price,
          quantity: cat.quantity,
          productId: product.id,
        })),
      });
    }

    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: { categories: true },
    });
  }

  async updateWithUpsert(id: number, data: updateProductDto) {
    // 1- نعدل بيانات المنتج نفسه
    const product = await this.prisma.product.update({
      where: { id: id },
      data: {
        name: data.name,
        price: data.price || 0,
        quantity: +data.quantity || 0,
        image: data.image || undefined,
        description: data.description,
        available:
          data.available === "true"
            ? true
            : data.available === "false"
              ? false
              : undefined,
      },
    });

    // 2- IDs اللي جاية من الـ frontend
    const incomingIds =
      data.categories?.filter((c) => c.id)?.map((c) => c.id) || [];

    // 3- نمسح أي كاتيجوري مش موجودة في incomingIds
    await this.prisma.productCategory.deleteMany({
      where: {
        productId: product.id,
        NOT: {
          id: { in: incomingIds },
        },
      },
    });

    // 4- نعمل upsert لكل كاتيجوري
    if (data.categories && data.categories.length > 0) {
      for (const cat of data.categories) {
        if (cat.id) {
          // Update موجود
          await this.prisma.productCategory.update({
            where: { id: cat.id },
            data: {
              name: cat.name,
              price: cat.price,
              quantity: cat.quantity,
            },
          });
        } else {
          // Create جديد
          await this.prisma.productCategory.create({
            data: {
              name: cat.name,
              price: cat.price,
              quantity: cat.quantity,
              productId: product.id,
            },
          });
        }
      }
    }

    // 5- نرجع المنتج مع الكاتيجوريز
    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: { categories: true },
    });
  }

  async getOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        quantity: true,
        image: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
          },
        },
      },
    });
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  async delete(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);
    return this.prisma.product.delete({ where: { id } });
  }

  async getAll(
    page = 1,
    size = 10,
    filters?: { name?: string; quantity?: number }
  ) {
    const skip = (page - 1) * size;
    const where: Prisma.ProductWhereInput = {};

    if (filters?.name) {
      where.name = {
        contains: filters.name,
      } as any; // Prisma JSON filter
    }

    if (filters?.quantity !== undefined) {
      where.quantity = { lte: filters.quantity };
    }

    let [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          quantity: true,
          image: true,
          createdAt: true,
          available: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    items = items.map((i) => {
      let totalQuantity = 0;
      if (i.categories.length) {
        i.categories.forEach((c) => {
          totalQuantity += c.quantity;
        });
      } else {
        totalQuantity = i.quantity;
      }
      return {
        ...i,
        quantity: totalQuantity,
        status:
          totalQuantity >= 10
            ? "متوفر"
            : totalQuantity <= 0
              ? "غير متوفر"
              : "منخفض",
      };
    });
    return {
      data: items,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  // ----------------- CATEGORY METHODS -----------------
  async addCategory(data: CreateCategoryDto) {
    return this.prisma.productCategory.create({ data });
  }

  async updateCategory(id: number, data: UpdateCategoryDto) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category)
      throw new NotFoundException(`Category with id ${id} not found`);
    return this.prisma.productCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category)
      throw new NotFoundException(`Category with id ${id} not found`);
    return this.prisma.productCategory.delete({ where: { id } });
  }
}
