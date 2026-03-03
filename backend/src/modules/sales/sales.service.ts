import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StockService } from '../stock/stock.service';
import { SaleStatus, PaymentMethod } from '../../common/enums';

export class CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export class CreateSaleDto {
  paymentMethod: PaymentMethod;
  items: CreateSaleItemDto[];
  discount?: number;
  taxRate?: number;
  note?: string;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async create(cashierId: string, dto: CreateSaleDto) {
    const { items, paymentMethod, discount = 0, taxRate = 0.2, note } = dto;

    // Compute totals
    const subtotal = items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity - (i.discount ?? 0),
      0,
    );
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount - discount;

    // Generate sale number: SALE-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.sale.count();
    const saleNumber = `SALE-${today}-${String(count + 1).padStart(4, '0')}`;

    // Create sale in transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          saleNumber,
          cashierId,
          paymentMethod,
          status: SaleStatus.COMPLETED,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          total,
          note,
          saleItems: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount ?? 0,
              total: i.unitPrice * i.quantity - (i.discount ?? 0),
            })),
          },
        },
        include: { saleItems: true },
      });
      return created;
    });

    // Deduct stock outside transaction (can be queued in future)
    for (const item of items) {
      await this.stockService.deduct(item.productId, item.quantity);
    }

    return sale;
  }

  findAll(cashierId?: string) {
    return this.prisma.sale.findMany({
      where: cashierId ? { cashierId } : undefined,
      include: { cashier: { select: { name: true } }, saleItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.sale.findUniqueOrThrow({
      where: { id },
      include: {
        cashier: { select: { name: true, email: true } },
        saleItems: { include: { product: true } },
      },
    });
  }
}
