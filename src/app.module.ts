import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./app/auth/auth.module";
import { UsersModule } from "./app/users/users.module";
import { NotificationModule } from "./app/notification/notification.module";

import { ChatGateway } from "./order.gateway";
import { ProductController } from "./app/product/product.controller";
import { ProductModule } from "./app/product/product.module";

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
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
