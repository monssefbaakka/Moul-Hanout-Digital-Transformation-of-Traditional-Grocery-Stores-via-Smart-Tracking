import { Injectable } from '@nestjs/common';
import { SaleStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GetInventoryReportQueryDto, GetSalesReportQueryDto } from './dto/report.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(shopId: string, dto: GetSalesReportQueryDto) {
    const from = dto.from
      ? new Date(dto.from + 'T00:00:00.000Z')
      : new Date(Date.now() - 30 * MS_PER_DAY);
    const to = dto.to ? new Date(dto.to + 'T23:59:59.999Z') : new Date();

    const sales = (await this.prisma.sale.findMany({
      where: {
        shopId,
        status: SaleStatus.COMPLETED,
        soldAt: { gte: from, lte: to },
      },
      select: { soldAt: true, totalAmount: true },
    } as never)) as { soldAt: Date; totalAmount: number }[];

    const dayMap = new Map<string, { date: string; revenue: number; transactions: number }>();
    let totalRevenue = 0;

    for (const sale of sales) {
      const date = sale.soldAt.toISOString().split('T')[0];
      const day = dayMap.get(date) ?? { date, revenue: 0, transactions: 0 };
      day.revenue += sale.totalAmount;
      day.transactions += 1;
      dayMap.set(date, day);
      totalRevenue += sale.totalAmount;
    }

    const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      days,
      totalRevenue,
      totalTransactions: sales.length,
    };
  }

  async getInventoryReport(shopId: string, dto: GetInventoryReportQueryDto) {
    const expiryDays = dto.days ?? 7;
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + expiryDays * MS_PER_DAY);

    const [allProducts, expiringSoonRaw] = (await Promise.all([
      this.prisma.product.findMany({
        where: { shopId, isActive: true },
        include: { category: true },
        orderBy: { name: 'asc' },
      } as never),
      this.prisma.product.findMany({
        where: {
          shopId,
          isActive: true,
          expirationDate: { gte: now, lte: expiryThreshold },
        },
        include: { category: true },
        orderBy: { expirationDate: 'asc' },
      } as never),
    ])) as [any[], any[]];

    const toItem = (p: any) => ({
      id: p.id,
      name: p.name,
      currentStock: p.currentStock,
      lowStockThreshold: p.lowStockThreshold,
      unit: p.unit ?? null,
      categoryName: p.category?.name ?? 'Unknown',
    });

    return {
      lowStock: allProducts
        .filter((p) => p.currentStock <= p.lowStockThreshold)
        .map(toItem),
      expiringSoon: expiringSoonRaw.map((p) => ({
        ...toItem(p),
        expirationDate: p.expirationDate?.toISOString() ?? null,
      })),
    };
  }

  async exportSalesCsv(shopId: string, dto: GetSalesReportQueryDto): Promise<string> {
    const report = await this.getSalesReport(shopId, dto);

    const rows = [
      'Date,Revenu (MAD),Transactions',
      ...report.days.map((d) => `${d.date},${d.revenue.toFixed(2)},${d.transactions}`),
      `Total,${report.totalRevenue.toFixed(2)},${report.totalTransactions}`,
    ];

    return rows.join('\n');
  }
}
