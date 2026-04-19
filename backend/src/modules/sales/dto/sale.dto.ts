import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaymentMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
