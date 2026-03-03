import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dailySales(date: string) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    return this.prisma.sale.aggregate({
      where: { createdAt: { gte: start, lt: end } },
      _count: true,
      _sum: { total: true, taxAmount: true, discount: true },
    });
  }

  async topProducts(limit = 10) {
    return this.prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });
  }

  async cashierPerformance(startDate: string, endDate: string) {
    return this.prisma.sale.groupBy({
      by: ['cashierId'],
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _count: true,
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
    });
  }

  async inventorySummary() {
    return this.prisma.stockItem.groupBy({
      by: ['status'],
      _count: true,
      _sum: { quantity: true },
    });
  }
}
