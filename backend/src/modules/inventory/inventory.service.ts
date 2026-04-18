import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StockInDto, StockOutDto } from './dto/inventory.dto';

const EXPIRING_SOON_DAYS = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findInventory(shopId: string) {
    const products = await this.prisma.product.findMany({
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
    } as never);

    return products.map((product) => this.toInventoryItem(product));
  }

  async stockIn(shopId: string, userId: string, dto: StockInDto) {
    const product = await this.ensureActiveProductBelongsToShop(shopId, dto.productId);
    const quantityDelta = dto.quantity;
    const updatedStock = product.currentStock + quantityDelta;
    const expirationDate = dto.expirationDate ? new Date(dto.expirationDate) : undefined;

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: updatedStock,
          expirationDate,
        },
        include: {
          category: true,
        },
      } as never);

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: MovementType.IN,
          qtyDelta: quantityDelta,
          reason: dto.reason,
          createdBy: userId,
        },
      } as never);

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'STOCK_IN',
          entityType: 'PRODUCT',
          entityId: product.id,
          payload: {
            quantity: dto.quantity,
            reason: dto.reason,
            previousStock: product.currentStock,
            newStock: updatedStock,
            expirationDate: updatedProduct.expirationDate,
          },
        },
      } as never);

      return this.toInventoryItem(updatedProduct);
    });
  }

  async stockOut(shopId: string, userId: string, dto: StockOutDto) {
    const product = await this.ensureActiveProductBelongsToShop(shopId, dto.productId);

    if (dto.quantity > product.currentStock) {
      throw new UnprocessableEntityException(
        'Cannot remove more stock than is currently available',
      );
    }

    const quantityDelta = -dto.quantity;
    const updatedStock = product.currentStock + quantityDelta;

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: updatedStock,
        },
        include: {
          category: true,
        },
      } as never);

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: MovementType.OUT,
          qtyDelta: quantityDelta,
          reason: dto.reason,
          createdBy: userId,
        },
      } as never);

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'STOCK_OUT',
          entityType: 'PRODUCT',
          entityId: product.id,
          payload: {
            quantity: dto.quantity,
            reason: dto.reason,
            previousStock: product.currentStock,
            newStock: updatedStock,
          },
        },
      } as never);

      return this.toInventoryItem(updatedProduct);
    });
  }

  async findExpiringSoon(shopId: string) {
    const inventory = await this.findInventory(shopId);

    return inventory
      .filter(
        (item) =>
          item.currentStock > 0 &&
          item.expirationDate &&
          this.isExpiringSoon(item.expirationDate),
      )
      .sort((left, right) => {
        const leftExpiry = left.expirationDate ? new Date(left.expirationDate).getTime() : 0;
        const rightExpiry = right.expirationDate ? new Date(right.expirationDate).getTime() : 0;
        return leftExpiry - rightExpiry;
      });
  }

  async findRecentMovements(shopId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        product: {
          shopId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    } as never);

    return movements.map((movement) => ({
      id: movement.id,
      productId: movement.productId,
      productName: movement.product.name,
      type: movement.type,
      quantityDelta: movement.qtyDelta,
      reason: movement.reason,
      createdBy: movement.user.id,
      createdByName: movement.user.name,
      createdAt: movement.createdAt,
    }));
  }

  private async ensureActiveProductBelongsToShop(shopId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        shopId,
        isActive: true,
      },
      include: {
        category: true,
      },
    } as never);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private toInventoryItem(product: {
    id: string;
    name: string;
    categoryId: string;
    category?: { name: string } | null;
    barcode?: string | null;
    unit?: string | null;
    currentStock: number;
    lowStockThreshold: number;
    expirationDate?: Date | null;
  }) {
    const expirationDate = product.expirationDate?.toISOString() ?? null;

    return {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? 'Unknown category',
      barcode: product.barcode ?? null,
      unit: product.unit ?? null,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold,
      expirationDate,
      isLowStock: product.currentStock <= product.lowStockThreshold,
      isExpiringSoon: this.isExpiringSoon(expirationDate),
    };
  }

  private isExpiringSoon(expirationDate?: string | null) {
    if (!expirationDate) {
      return false;
    }

    const timeUntilExpiry = new Date(expirationDate).getTime() - Date.now();

    return timeUntilExpiry >= 0 && timeUntilExpiry <= EXPIRING_SOON_DAYS * MILLISECONDS_PER_DAY;
  }
}
