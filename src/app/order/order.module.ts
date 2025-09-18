import { Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CartModule } from "../cart/cart.module";
import { NotificationModule } from "../notification/notification.module";
import { OrderController } from "./order.controller";

@Module({
  imports: [CartModule, NotificationModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
