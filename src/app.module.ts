import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./app/auth/auth.module";
import { UsersModule } from "./app/users/users.module";
import { NotificationModule } from "./app/notification/notification.module";

import { ChatGateway } from "./order.gateway";
import { ProductModule } from "./app/product/product.module";
import { CartModule } from "./app/cart/cart.module";
import { OrderModule } from "./app/order/order.module";
import { TransactionController } from "./app/transaction/transaction.controller";
import { TransactionService } from "./app/transaction/transaction.service";
import { TransactionModule } from "./app/transaction/transaction.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads", // URL prefix
    }),
    AuthModule,
    UsersModule,
    NotificationModule,
    ProductModule,
    CartModule,
    OrderModule,
    TransactionModule,
  ],
  controllers: [AppController, TransactionController],
  providers: [AppService, ChatGateway, TransactionService],
})
export class AppModule {}
