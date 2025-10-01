import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsJSON,
  IsPositive,
  IsNotEmpty,
} from "class-validator";
import { Transform, Type } from "class-transformer";
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

  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean = true;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quantity?: number = 0;

  @IsJSON()
  @IsOptional()
  categories?: { name: string; price: number; quantity: number }[];
}

export class updateProductDto {
  @IsString()
  @IsOptional()
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

  @IsString()
  @IsOptional()
  available?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsJSON()
  @IsOptional()
  categories?: {
    id: number | undefined;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
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
