import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "src/middlewares/jwt-auth.guard";
import { LoggedInUserType } from "../auth/auth.dto";
import { NoFilesInterceptor } from "@nestjs/platform-express";

@Controller("cart")
export class CartController {
  constructor(private cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(NoFilesInterceptor())
  @Post("/addToCart")
  addToCart(@Body() data: any, @Req() req) {
    const loggedInUser = req.user as LoggedInUserType;
    const result = this.cartService.addToCart(loggedInUser.id, data);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/userCart")
  getUserCart(@Req() req) {
    const loggedInUser = req.user as LoggedInUserType;
    const result = this.cartService.getUserCart(loggedInUser.id);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(NoFilesInterceptor())
  @Patch("/updateCartProduct/:id")
  updateCartProduct(@Body() data: any, @Param("id") id: number) {
    const result = this.cartService.updateCartProduct(+id, data);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Delete("/deleteCartProduct/:id")
  deleteCartProduct(@Req() req, @Param("id") id: number) {
    const result = this.cartService.deleteCartProduct(+id);
    return result;
  }
}
