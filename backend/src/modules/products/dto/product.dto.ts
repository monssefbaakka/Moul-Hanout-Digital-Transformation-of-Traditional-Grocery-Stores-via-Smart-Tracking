import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Bouteille d eau 1.5L' })
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MaxLength(120, { message: 'Product name cannot exceed 120 characters' })
  name: string;

  @ApiProperty({ example: 'cat-123' })
  @IsString()
  @IsNotEmpty({ message: 'Category id is required' })
  categoryId: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @Min(0, { message: 'Sale price must be greater than or equal to 0' })
  salePrice: number;

  @ApiPropertyOptional({ example: 5.25 })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Cost price must be greater than or equal to 0' })
  costPrice?: number;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(64, { message: 'Barcode cannot exceed 64 characters' })
  barcode?: string;

  @ApiPropertyOptional({ example: 'Pack of 6 bottles' })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Description cannot exceed 300 characters' })
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'piece' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Unit cannot exceed 30 characters' })
  unit?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Photo URL cannot exceed 500 characters' })
  photo?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Low stock threshold must be greater than or equal to 0' })
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: '2026-04-25T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO date string' })
  expirationDate?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
