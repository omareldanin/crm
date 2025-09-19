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
    return this.prisma.product.create({
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
  }

  async update(id: number, data: updateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);
    return this.prisma.product.update({
      where: { id },
      data,
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

    const [items, total] = await this.prisma.$transaction([
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
