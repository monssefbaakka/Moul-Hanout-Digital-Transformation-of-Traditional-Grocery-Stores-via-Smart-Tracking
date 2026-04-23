import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  GetInventoryReportQueryDto,
  GetSalesReportQueryDto,
} from './dto/report.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DASHBOARD_EXPIRING_DAYS = 5;
const DASHBOARD_SALES_TREND_DAYS = 7;
const DASHBOARD_RECENT_SALES_LIMIT = 6;

const salesReportSelect = {
  soldAt: true,
  totalAmount: true,
} satisfies Prisma.SaleSelect;

const inventoryReportInclude = {
  category: true,
} satisfies Prisma.ProductInclude;

type InventoryReportProduct = Prisma.ProductGetPayload<{
  include: typeof inventoryReportInclude;
}>;

const dashboardRecentSalesInclude = {
  cashier: {
    select: {
      name: true,
    },
  },
  items: {
    select: {
      qty: true,
    },
  },
} satisfies Prisma.SaleInclude;

type DashboardRecentSaleRecord = Prisma.SaleGetPayload<{
  include: typeof dashboardRecentSalesInclude;
}>;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(shopId: string, dto: GetSalesReportQueryDto) {
    const timeZone = await this.getShopTimeZone(shopId);

    return this.buildSalesReport(shopId, timeZone, dto);
  }

  async getDashboard(shopId: string) {
    const timeZone = await this.getShopTimeZone(shopId);
    const today = this.getCurrentDateInTimeZone(timeZone);
    const reportWindow = this.resolveSalesReportWindow(timeZone, {
      from: today,
      to: today,
    });

    const saleWhere: Prisma.SaleWhereInput = {
      shopId,
      status: SaleStatus.COMPLETED,
      soldAt: {
        gte: reportWindow.start,
        lt: reportWindow.endExclusive,
      },
    };

    const salesTrendStartDate = this.shiftDateByDays(
      today,
      -(DASHBOARD_SALES_TREND_DAYS - 1),
    );

    const [
      dailySalesCount,
      salesAggregate,
      inventoryReport,
      totalProducts,
      salesTrend,
      recentSales,
    ] = await Promise.all([
      this.prisma.sale.count({
        where: saleWhere,
      }),
      this.prisma.sale.aggregate({
        where: saleWhere,
        _sum: {
          totalAmount: true,
        },
      }),
      this.getInventoryReport(shopId, { days: DASHBOARD_EXPIRING_DAYS }),
      this.prisma.product.count({
        where: {
          shopId,
          isActive: true,
        },
      }),
      this.buildSalesReport(shopId, timeZone, {
        from: salesTrendStartDate,
        to: today,
      }),
      this.prisma.sale.findMany({
        where: {
          shopId,
          status: SaleStatus.COMPLETED,
        },
        include: dashboardRecentSalesInclude,
        orderBy: {
          soldAt: 'desc',
        },
        take: DASHBOARD_RECENT_SALES_LIMIT,
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      businessDate: today,
      dailySalesTotal: salesAggregate._sum.totalAmount ?? 0,
      dailySalesCount,
      totalProducts,
      lowStockProducts: inventoryReport.lowStock,
      expiringProducts: inventoryReport.expiringSoon,
      salesTrend: salesTrend.days,
      recentSales: recentSales.map((sale) => this.toDashboardRecentSale(sale)),
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

  private async buildSalesReport(
    shopId: string,
    timeZone: string,
    dto: GetSalesReportQueryDto,
  ) {
    const reportWindow = this.resolveSalesReportWindow(timeZone, dto);
    const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const sales = await this.prisma.sale.findMany({
      where: {
        shopId,
        status: SaleStatus.COMPLETED,
        soldAt: { gte: reportWindow.start, lt: reportWindow.endExclusive },
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

  private async getShopTimeZone(shopId: string) {
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

    return shop.timezone;
  }

  private resolveSalesReportWindow(
    timeZone: string,
    query: GetSalesReportQueryDto,
  ) {
    const today = this.getCurrentDateInTimeZone(timeZone);
    const toDate = query.to ?? today;
    const defaultFromDate = this.shiftDateByDays(toDate, -30);
    const fromDate = query.from ?? defaultFromDate;
    const dayAfterToDate = this.shiftDateByDays(toDate, 1);

    return {
      start: this.createStartOfDayInTimeZone(fromDate, timeZone),
      endExclusive: this.createStartOfDayInTimeZone(dayAfterToDate, timeZone),
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

  private createStartOfDayInTimeZone(dateValue: string, timeZone: string) {
    const [year, month, day] = dateValue.split('-').map((part) => Number(part));
    const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const initialOffset = this.getTimeZoneOffsetInMilliseconds(
      utcGuess,
      timeZone,
    );
    const resolvedDate = new Date(utcGuess.getTime() - initialOffset);
    const resolvedOffset = this.getTimeZoneOffsetInMilliseconds(
      resolvedDate,
      timeZone,
    );

    return new Date(utcGuess.getTime() - resolvedOffset);
  }

  private getTimeZoneOffsetInMilliseconds(date: Date, timeZone: string) {
    const timeZoneName = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;

    if (!timeZoneName) {
      return 0;
    }

    return this.parseTimeZoneOffset(timeZoneName);
  }

  private parseTimeZoneOffset(timeZoneName: string) {
    if (timeZoneName === 'GMT') {
      return 0;
    }

    const match = /^GMT([+-])(\d{1,2}):(\d{2})$/.exec(timeZoneName);

    if (!match) {
      return 0;
    }

    const [, sign, hours, minutes] = match;
    const totalMilliseconds =
      (Number(hours) * 60 + Number(minutes)) * 60 * 1000;

    return sign === '+' ? totalMilliseconds : -totalMilliseconds;
  }

  private toDashboardRecentSale(sale: DashboardRecentSaleRecord) {
    return {
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      soldAt: sale.soldAt.toISOString(),
      status: sale.status,
      paymentMode: sale.paymentMode,
      cashierName: sale.cashier.name,
      total: sale.totalAmount,
      itemCount: sale.items.reduce((count, item) => count + item.qty, 0),
    };
  }
}
