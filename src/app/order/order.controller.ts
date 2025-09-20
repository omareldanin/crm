import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Patch,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderStatus, Prisma } from "@prisma/client";
import { JwtAuthGuard } from "src/middlewares/jwt-auth.guard";
import { LoggedInUserType } from "../auth/auth.dto";
import { NoFilesInterceptor } from "@nestjs/platform-express";

@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Get("/getAll")
  async getAll(
    @Req() req,
    @Query("vendorId") vendorId?: string,
    @Query("deliveryId") deliveryId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("status") status?: OrderStatus
  ) {
    const loggedInUser = req.user as LoggedInUserType;

    return this.orderService.getAll({
      vendorId:
        loggedInUser.role === "VENDOR"
          ? loggedInUser.id
          : vendorId
            ? Number(vendorId)
            : undefined,
      status: status ? status : undefined,
      deliveryId: deliveryId ? Number(deliveryId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : 1,
      size: size ? Number(size) : 10,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/statistics")
  async getStatistics(
    @Req() req,
    @Query("vendorId") vendorId?: string,
    @Query("deliveryId") deliveryId?: string
  ) {
    const loggedInUser = req.user as LoggedInUserType;

    return this.orderService.getOrderStatistics(
      loggedInUser.role === "VENDOR"
        ? loggedInUser.id
        : vendorId
          ? +vendorId
          : undefined,
      loggedInUser.role === "DELIVERY"
        ? loggedInUser.id
        : deliveryId
          ? +deliveryId
          : undefined
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("/:id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    return this.orderService.getOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/create")
  @UseInterceptors(NoFilesInterceptor())
  async create(@Body() data: { notes?: string }, @Req() req) {
    const loggedInUser = req.user as LoggedInUserType;

    return this.orderService.create({
      vendorId: loggedInUser.id,
      notes: data.notes,
      name: loggedInUser.name,
    });
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(NoFilesInterceptor())
  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body()
    data: {
      paidAmount?: number;
      status?: OrderStatus;
      deliveryId?: number;
    }
  ) {
    return this.orderService.update(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("/:id")
  async delete(@Param("id", ParseIntPipe) id: number, @Req() req) {
    const loggedInUser = req.user as LoggedInUserType;
    return this.orderService.delete(id, loggedInUser.id);
  }
}
