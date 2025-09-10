import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  Req,
  Patch,
} from "@nestjs/common";
import { ProductService } from "./product.service";
import { Prisma } from "@prisma/client";
import { JwtAuthGuard } from "src/middlewares/jwt-auth.guard";
import { UploadImageInterceptor } from "src/middlewares/file-upload.interceptor";
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
} from "./product.dto";
import { LoggedInUserType } from "../auth/auth.dto";

@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @UploadImageInterceptor("image")
  @Post("/create")
  async create(
    @Body() data: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req
  ) {
    const loggedInUser = req.user as LoggedInUserType;

    if (file) {
      data.image = "uploads/" + file.filename;
    }

    const product = this.productService.create({
      data,
      userid: loggedInUser.id,
    });
    return { message: "success", product };
  }

  @UseGuards(JwtAuthGuard)
  @UploadImageInterceptor("image")
  @Patch("/edit/:id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: Prisma.ProductUpdateInput,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (file) {
      data.image = "uploads/" + file.filename;
    }
    const product = await this.productService.update(id, data);
    return { message: "success", product };
  }

  @UseGuards(JwtAuthGuard)
  @Get("/get/:id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    const product = await this.productService.getOne(id);
    return { message: "success", product };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("/getAll/:id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.productService.delete(id);
    return { message: "success" };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(
    @Query("page") page = "1",
    @Query("size") size = "10",
    @Query("name") name?: string,
    @Query("quantity") quantity?: string
  ) {
    return this.productService.getAll(Number(page), Number(size), {
      name,
      quantity: quantity ? Number(quantity) : undefined,
    });
  }

  // ----------------- CATEGORY ENDPOINTS -----------------
  @UseGuards(JwtAuthGuard)
  @UploadImageInterceptor("image")
  @Post("/categories")
  async addCategory(
    @Body() data: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const category = await this.productService.addCategory(data);
    return { message: "success", category };
  }

  @UseGuards(JwtAuthGuard)
  @UploadImageInterceptor("image")
  @Patch("/categories/:id")
  async updateCategory(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const category = await this.productService.updateCategory(id, data);
    return { message: "success", category };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("/categories/:id")
  async deleteCategory(@Param("id", ParseIntPipe) id: number) {
    await this.productService.deleteCategory(id);
    return { message: "success" };
  }
}
