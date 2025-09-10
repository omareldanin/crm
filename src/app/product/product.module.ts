import { Module } from "@nestjs/common";
import { ProductService } from "./product.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { ProductController } from "./product.controller";

@Module({
  imports: [PrismaModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
