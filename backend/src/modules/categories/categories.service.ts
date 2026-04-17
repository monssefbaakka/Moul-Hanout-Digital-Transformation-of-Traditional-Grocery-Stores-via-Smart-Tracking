import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByShop(shopId: string) {
    return this.prisma.category.findMany({
      where: {
        shopId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  create(shopId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        shopId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }
}
