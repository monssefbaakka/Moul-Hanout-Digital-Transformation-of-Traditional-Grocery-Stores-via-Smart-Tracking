import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Boissons' })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MaxLength(80, { message: 'Category name cannot exceed 80 characters' })
  name: string;

  @ApiPropertyOptional({ example: 'Soft drinks and bottled water' })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Description cannot exceed 300 characters' })
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
