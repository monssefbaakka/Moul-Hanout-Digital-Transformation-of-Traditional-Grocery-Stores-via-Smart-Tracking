import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByShop(shopId: string) {
    return this.prisma.product.findMany({
      where: {
        shopId,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(shopId: string, dto: CreateProductDto) {
    this.validatePricing(dto.salePrice, dto.costPrice);
    await this.ensureCategoryBelongsToShop(shopId, dto.categoryId);
    await this.ensureBarcodeIsUnique(shopId, dto.barcode);

    return this.prisma.product.create({
      data: {
        shopId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        unit: dto.unit,
        photo: dto.photo,
        barcode: dto.barcode,
        salePrice: dto.salePrice,
        costPrice: dto.costPrice,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  async update(shopId: string, productId: string, dto: UpdateProductDto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id: productId,
        shopId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const salePrice = dto.salePrice ?? existingProduct.salePrice;
    const costPrice =
      dto.costPrice === undefined ? existingProduct.costPrice ?? undefined : dto.costPrice;

    this.validatePricing(salePrice, costPrice);

    if (dto.categoryId) {
      await this.ensureCategoryBelongsToShop(shopId, dto.categoryId);
    }

    if (dto.barcode !== undefined) {
      await this.ensureBarcodeIsUnique(shopId, dto.barcode, productId);
    }

    return this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        unit: dto.unit,
        photo: dto.photo,
        barcode: dto.barcode,
        salePrice: dto.salePrice,
        costPrice: dto.costPrice,
        lowStockThreshold: dto.lowStockThreshold,
        expirationDate:
          dto.expirationDate === undefined
            ? undefined
            : dto.expirationDate
              ? new Date(dto.expirationDate)
              : null,
      },
      include: {
        category: true,
      },
    });
  }

  private validatePricing(salePrice: number, costPrice?: number) {
    if (costPrice !== undefined && costPrice > salePrice) {
      throw new UnprocessableEntityException('RG08: costPrice cannot be greater than salePrice');
    }
  }

  private async ensureCategoryBelongsToShop(shopId: string, categoryId: string) {
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

  private async ensureBarcodeIsUnique(
    shopId: string,
    barcode?: string,
    excludedProductId?: string,
  ) {
    if (!barcode) {
      return;
    }

    const duplicate = await this.prisma.product.findFirst({
      where: {
        shopId,
        barcode,
        ...(excludedProductId
          ? {
              id: {
                not: excludedProductId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      throw new ConflictException('RG07: barcode must be unique within a shop');
    }
  }
}
