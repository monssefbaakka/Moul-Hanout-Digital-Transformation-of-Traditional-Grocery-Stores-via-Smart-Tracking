import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class GetSalesReportQueryDto {
  @ApiPropertyOptional({ example: '2026-03-20' })
  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO date string' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-04-19' })
  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO date string' })
  to?: string;
}

export class GetInventoryReportQueryDto {
  @ApiPropertyOptional({
    example: 7,
    default: 7,
    description: 'Days ahead to check for expiring products',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}
