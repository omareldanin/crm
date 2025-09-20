import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  transactionSelect,
  transactionSelectReform,
} from "./transaction.response";

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async getAll(filters: {
    vendorId?: number;
    deliveryId?: number;
    confirmed?: boolean;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    size?: number;
  }) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.size && filters.size > 0 ? filters.size : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: {
          vendorId: filters.vendorId ? +filters.vendorId : undefined,
          deliveryId: filters.deliveryId ? +filters.deliveryId : undefined,
          confirmed:
            typeof filters.confirmed === "boolean"
              ? filters.confirmed
              : undefined,
          createdAt:
            filters.startDate || filters.endDate
              ? {
                  gte: filters.startDate,
                  lte: filters.endDate,
                }
              : undefined,
        },
        select: transactionSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({
        where: {
          vendorId: filters.vendorId ? +filters.vendorId : undefined,
          deliveryId: filters.deliveryId ? +filters.deliveryId : undefined,
          confirmed:
            typeof filters.confirmed === "boolean"
              ? filters.confirmed
              : undefined,
          createdAt:
            filters.startDate || filters.endDate
              ? {
                  gte: filters.startDate,
                  lte: filters.endDate,
                }
              : undefined,
        },
      }),
    ]);

    return {
      results: data.map((t) => transactionSelectReform(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOne(id: number) {
    const transaction = this.prisma.transaction.findUnique({
      where: { id },
      select: transactionSelect,
    });
    if (!transaction) {
      throw new BadRequestException("لم يتم العثور على العمليه");
    }

    return {
      message: "success",
      results: transactionSelectReform(await transaction),
    };
  }

  async create(data: {
    paidAmount: number;
    vendorId?: number;
    deliveryId?: number;
    confirmed?: boolean;
  }) {
    return this.prisma.transaction.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.transaction.update({
      where: { id },
      data,
    });
  }
}
