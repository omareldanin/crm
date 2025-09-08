import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserRole, Permissions } from "@prisma/client";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @IsOptional()
  @IsString()
  fcm?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitudes?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(Permissions)
  permissions: Permissions[];
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @IsOptional()
  @IsString()
  fcm?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  online?: string;

  @IsOptional()
  @IsString()
  longitudes?: string;
}
