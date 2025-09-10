import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsJSON,
  IsPositive,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  available?: boolean = true;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quantity?: number = 0;
}

export class CreateCategoryDto {
  @IsJSON()
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quantity?: number = 0;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  productId?: number; // relation to Product
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
