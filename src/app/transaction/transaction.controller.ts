import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { JwtAuthGuard } from "src/middlewares/jwt-auth.guard";
import { LoggedInUserType } from "../auth/auth.dto";

@Controller("transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Get("/getAll")
  async getAll(
    @Req() req,
    @Query("vendorId") vendorId?: string,
    @Query("deliveryId") deliveryId?: string,
    @Query("confirmed") confirmed?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("size") size?: string
  ) {
    const loggedInUser = req.user as LoggedInUserType;

    if (loggedInUser.role === "VENDOR") {
      vendorId = loggedInUser.id.toString();
    }

    if (loggedInUser.role === "DELIVERY") {
      deliveryId = loggedInUser.id.toString();
    }

    return this.transactionService.getAll({
      vendorId: vendorId ? +vendorId : undefined,
      deliveryId: deliveryId ? +deliveryId : undefined,
      confirmed:
        confirmed === "true" ? true : confirmed === "false" ? false : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? +page : 1,
      size: size ? +size : 10,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/:id")
  async getOne(@Param("id") id: string) {
    return this.transactionService.getOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/create")
  async create(
    @Req() req,
    @Body()
    body: {
      paidAmount: number;
      vendorId?: number;
      deliveryId?: number;
      confirmed?: boolean;
    }
  ) {
    const loggedInUser = req.user as LoggedInUserType;

    if (loggedInUser.role === "DELIVERY") {
      body.deliveryId = loggedInUser.id;
      body.confirmed = false;
    } else {
      body.confirmed = true;
    }

    return this.transactionService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/:id")
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      paidAmount: number;
      confirmed?: boolean;
    }
  ) {
    return this.transactionService.update(+id, body);
  }
}
