import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StockStatus } from '../../common/enums';

export class AdjustStockDto {
  productId: string;
  quantity: number;
  unit?: string;
  minQuantity?: number;
  expiryDate?: Date;
  batchNumber?: string;
  location?: string;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: StockStatus) {
    return this.prisma.stockItem.findMany({
      where: status ? { status } : undefined,
      include: { product: { include: { category: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findLowStock() {
    return this.findAll(StockStatus.LOW_STOCK);
  }

  findExpired() {
    return this.findAll(StockStatus.EXPIRED);
  }

  async adjust(dto: AdjustStockDto) {
    const stock = await this.prisma.stockItem.findFirst({
      where: { productId: dto.productId },
    });

    if (stock) {
      return this.prisma.stockItem.update({
        where: { id: stock.id },
        data: {
          quantity: { increment: dto.quantity },
          ...(dto.unit && { unit: dto.unit }),
          ...(dto.minQuantity && { minQuantity: dto.minQuantity }),
          ...(dto.expiryDate && { expiryDate: dto.expiryDate }),
          ...(dto.batchNumber && { batchNumber: dto.batchNumber }),
          ...(dto.location && { location: dto.location }),
        },
      });
    }

    return this.prisma.stockItem.create({
      data: {
        productId: dto.productId,
        quantity: dto.quantity,
        unit: dto.unit ?? 'unit',
        minQuantity: dto.minQuantity ?? 5,
        expiryDate: dto.expiryDate,
        batchNumber: dto.batchNumber,
        location: dto.location,
      },
    });
  }

  async deduct(productId: string, quantity: number) {
    const stock = await this.prisma.stockItem.findFirst({ where: { productId } });
    if (!stock) throw new NotFoundException(`Stock for product ${productId} not found`);
    return this.prisma.stockItem.update({
      where: { id: stock.id },
      data: { quantity: { decrement: quantity } },
    });
  }
}
