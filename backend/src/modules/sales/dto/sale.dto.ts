import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaymentMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSaleItemDto {
  @ApiProperty({ example: 'product-123' })
  @IsString()
  @IsNotEmpty({ message: 'Product id is required' })
  productId: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Discount must be greater than or equal to 0' })
  discount?: number;
}

export class CreateSaleDto {
  @ApiProperty({ enum: PaymentMode, example: PaymentMode.CASH })
  @IsEnum(PaymentMode, { message: 'Payment mode must be CASH, CARD, or OTHER' })
  paymentMode: PaymentMode;

  @ApiProperty({
    type: [CreateSaleItemDto],
    example: [
      { productId: 'product-123', quantity: 2, discount: 0 },
      { productId: 'product-456', quantity: 1, discount: 1.5 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one sale item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}

export class GetSalesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString({}, { message: 'From date must be a valid ISO date string' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-04-19' })
  @IsOptional()
  @IsDateString({}, { message: 'To date must be a valid ISO date string' })
  to?: string;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
