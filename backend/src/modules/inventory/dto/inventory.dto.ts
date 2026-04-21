import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class StockInDto {
  @ApiProperty({ example: 'product-123' })
  @IsString()
  @IsNotEmpty({ message: 'Product id is required' })
  productId: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiProperty({ example: 'Manual restock after morning delivery' })
  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  @MaxLength(200, { message: 'Reason cannot exceed 200 characters' })
  reason: string;

  @ApiPropertyOptional({ example: '2026-04-25T00:00:00.000Z' })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expiration date must be a valid ISO date string' },
  )
  expirationDate?: string;
}

export class StockOutDto {
  @ApiProperty({ example: 'product-123' })
  @IsString()
  @IsNotEmpty({ message: 'Product id is required' })
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiProperty({ example: 'Damaged packaging removed from shelf' })
  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  @MaxLength(200, { message: 'Reason cannot exceed 200 characters' })
  reason: string;
}
