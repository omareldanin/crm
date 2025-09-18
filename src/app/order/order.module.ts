import { Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CartModule } from "../cart/cart.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [CartModule, NotificationModule],
  providers: [OrderService],
})
export class OrderModule {}
