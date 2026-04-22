import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  GetInventoryReportQueryDto,
  GetSalesReportQueryDto,
} from './dto/report.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const salesReportSelect = {
  soldAt: true,
  totalAmount: true,
} satisfies Prisma.SaleSelect;

type SalesReportSale = Prisma.SaleGetPayload<{
  select: typeof salesReportSelect;
}>;

const inventoryReportInclude = {
  category: true,
} satisfies Prisma.ProductInclude;

type InventoryReportProduct = Prisma.ProductGetPayload<{
  include: typeof inventoryReportInclude;
}>;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(shopId: string, dto: GetSalesReportQueryDto) {
    const shop = await this.prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        timezone: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const reportWindow = this.resolveSalesReportWindow(shop.timezone, dto);
    const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: shop.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const sales = await this.prisma.sale.findMany({
      where: {
        shopId,
        status: SaleStatus.COMPLETED,
        soldAt: { gte: reportWindow.start, lte: reportWindow.end },
      },
      select: salesReportSelect,
    });

    const dayMap = new Map<
      string,
      { date: string; revenue: number; transactions: number }
    >();
    let totalRevenue = 0;

    for (const sale of sales) {
      const localDate = localDateFormatter.format(sale.soldAt);
      const day = dayMap.get(localDate) ?? {
        date: localDate,
        revenue: 0,
        transactions: 0,
      };
      day.revenue += sale.totalAmount;
      day.transactions += 1;
      dayMap.set(localDate, day);
      totalRevenue += sale.totalAmount;
    }

    const days = Array.from(dayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

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

    const [allProducts, expiringSoonRaw] = await Promise.all([
      this.prisma.product.findMany({
        where: { shopId, isActive: true },
        include: inventoryReportInclude,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.findMany({
        where: {
          shopId,
          isActive: true,
          expirationDate: { gte: now, lte: expiryThreshold },
        },
        include: inventoryReportInclude,
        orderBy: { expirationDate: 'asc' },
      }),
    ]);

    const toItem = (p: InventoryReportProduct) => ({
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

  async exportSalesCsv(
    shopId: string,
    dto: GetSalesReportQueryDto,
  ): Promise<string> {
    const report = await this.getSalesReport(shopId, dto);

    const rows = [
      'Date,Revenu (MAD),Transactions',
      ...report.days.map(
        (d) => `${d.date},${d.revenue.toFixed(2)},${d.transactions}`,
      ),
      `Total,${report.totalRevenue.toFixed(2)},${report.totalTransactions}`,
    ];

    return rows.join('\n');
  }

  private resolveSalesReportWindow(
    timeZone: string,
    query: GetSalesReportQueryDto,
  ) {
    const today = this.getCurrentDateInTimeZone(timeZone);
    const toDate = query.to ?? today;
    const defaultFromDate = this.shiftDateByDays(toDate, -30);
    const fromDate = query.from ?? defaultFromDate;

    return {
      start: this.createTimeZoneBoundary(fromDate, timeZone, 'start'),
      end: this.createTimeZoneBoundary(toDate, timeZone, 'end'),
    };
  }

  private shiftDateByDays(dateValue: string, dayOffset: number) {
    const date = new Date(`${dateValue}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + dayOffset);

    return date.toISOString().split('T')[0];
  }

  private getCurrentDateInTimeZone(timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private createTimeZoneBoundary(
    dateValue: string,
    timeZone: string,
    boundary: 'start' | 'end',
  ) {
    const [year, month, day] = dateValue.split('-').map((part) => Number(part));
    const hour = boundary === 'start' ? 0 : 23;
    const minute = boundary === 'start' ? 0 : 59;
    const second = boundary === 'start' ? 0 : 59;
    const millisecond = boundary === 'start' ? 0 : 999;
    const utcGuess = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second, millisecond),
    );
    const offset = this.getTimeZoneOffset(utcGuess, timeZone);

    return new Date(utcGuess.getTime() - offset);
  }

  private getTimeZoneOffset(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    const second = Number(parts.find((part) => part.type === 'second')?.value);

    const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);

    return asUtc - date.getTime();
  }
}
