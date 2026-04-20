import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

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

  async update(shopId: string, categoryId: string, dto: UpdateCategoryDto) {
    await this.ensureCategoryBelongsToShop(shopId, categoryId);

    return this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async deactivate(shopId: string, categoryId: string) {
    await this.ensureCategoryBelongsToShop(shopId, categoryId);
    await this.ensureCategoryHasNoActiveProducts(shopId, categoryId);

    return this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        isActive: false,
      },
    });
  }

  private async ensureCategoryBelongsToShop(
    shopId: string,
    categoryId: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        shopId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async ensureCategoryHasNoActiveProducts(
    shopId: string,
    categoryId: string,
  ) {
    const activeProduct = await this.prisma.product.findFirst({
      where: {
        shopId,
        categoryId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (activeProduct) {
      throw new UnprocessableEntityException(
        'Cannot deactivate a category with active products',
      );
    }
  }
}
