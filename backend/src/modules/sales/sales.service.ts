import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MovementType,
  PaymentStatus,
  Prisma,
  SaleStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { ALERTS_PORT } from '../alerts/alerts.port';
import type { AlertsPort } from '../alerts/alerts.port';
import {
  CreateSaleDto,
  GetDailySalesSummaryQueryDto,
  GetSalesQueryDto,
} from './dto/sale.dto';

const MAX_TOP_PRODUCTS = 5;

type SalesListEntry = Prisma.SaleGetPayload<{
  include: {
    cashier: {
      select: {
        id: true;
        name: true;
      };
    };
    items: {
      select: {
        qty: true;
      };
    };
  };
}>;

type SaleDetail = Prisma.SaleGetPayload<{
  include: {
    cashier: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            barcode: true;
            unit: true;
          };
        };
      };
    };
    payments: true;
  };
}>;

type SummarySaleItem = Prisma.SaleItemGetPayload<{
  select: {
    productId: true;
    qty: true;
    unitPrice: true;
    discount: true;
    product: {
      select: {
        name: true;
      };
    };
  };
}>;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ALERTS_PORT) private readonly alertsPort: AlertsPort,
  ) {}

  async getDailySummary(shopId: string, query: GetDailySalesSummaryQueryDto) {
    const shop = await this.prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        timezone: true,
      },
    } as never);

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const summaryWindow = this.resolveSummaryWindow(shop.timezone, query);
    const saleWhere: Prisma.SaleWhereInput = {
      shopId,
      status: SaleStatus.COMPLETED,
      soldAt: {
        gte: summaryWindow.start,
        lte: summaryWindow.end,
      },
    };

    const [transactionCount, revenueAggregate] =
      (await this.prisma.$transaction([
        this.prisma.sale.count({
          where: saleWhere,
        } as never),
        this.prisma.sale.aggregate({
          where: saleWhere,
          _sum: {
            totalAmount: true,
          },
        } as never),
      ])) as [
        number,
        {
          _sum: {
            totalAmount: number | null;
          };
        },
      ];
    const saleItems = (await this.prisma.saleItem.findMany({
      where: {
        sale: saleWhere,
      },
      select: {
        productId: true,
        qty: true,
        unitPrice: true,
        discount: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    } as never)) as unknown as SummarySaleItem[];

    const topProducts = this.buildTopProducts(saleItems);

    return {
      date: summaryWindow.label,
      totalRevenue: revenueAggregate._sum.totalAmount ?? 0,
      transactionCount,
      topProducts,
    };
  }

  async findOne(shopId: string, saleId: string) {
    const sale = await this.getSaleDetail(this.prisma, shopId, saleId);

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async findAll(shopId: string, query: GetSalesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildSaleListWhereClause(shopId, query);

    const [totalCount, sales] = (await this.prisma.$transaction([
      this.prisma.sale.count({ where } as never),
      this.prisma.sale.findMany({
        where,
        include: {
          cashier: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            select: {
              qty: true,
            },
          },
        },
        orderBy: {
          soldAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      } as never),
    ])) as [number, SalesListEntry[]];

    return {
      items: sales.map((sale) => ({
        id: sale.id,
        receiptNumber: sale.receiptNumber,
        soldAt: sale.soldAt,
        status: sale.status,
        paymentMode: sale.paymentMode,
        cashierId: sale.cashier.id,
        cashierName: sale.cashier.name,
        total: sale.totalAmount,
        itemCount: sale.items.reduce((count, item) => count + item.qty, 0),
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        from: query.from ?? null,
        to: query.to ?? null,
      },
    };
  }

  async create(shopId: string, userId: string, dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      const requestedProductIds = dto.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          shopId,
          isActive: true,
          id: {
            in: requestedProductIds,
          },
        },
      } as never);

      const productById = new Map(
        products.map((product) => [product.id, product]),
      );
      const requiredQuantities = this.aggregateRequestedQuantities(dto);

      for (const [
        productId,
        requiredQuantity,
      ] of requiredQuantities.entries()) {
        const product = productById.get(productId);

        if (!product) {
          throw new NotFoundException(`Product ${productId} not found`);
        }

        if (product.currentStock < requiredQuantity) {
          throw new UnprocessableEntityException(
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      const receiptNumber = this.generateReceiptNumber();
      const saleItemsData = dto.items.map((item) => {
        const product = productById.get(item.productId)!;
        const discount = item.discount ?? 0;

        if (discount > product.salePrice * item.quantity) {
          throw new UnprocessableEntityException(
            `Discount cannot exceed line total for product ${product.name}`,
          );
        }

        return {
          productId: item.productId,
          qty: item.quantity,
          unitPrice: product.salePrice,
          discount,
        };
      });

      const subtotal = saleItemsData.reduce(
        (sum, item) => sum + item.unitPrice * item.qty,
        0,
      );
      const totalDiscount = saleItemsData.reduce(
        (sum, item) => sum + (item.discount ?? 0),
        0,
      );
      const totalAmount = subtotal - totalDiscount;

      const sale = await tx.sale.create({
        data: {
          shopId,
          cashierUserId: userId,
          receiptNumber,
          subtotal,
          totalAmount,
          status: SaleStatus.COMPLETED,
          paymentMode: dto.paymentMode,
          items: {
            create: saleItemsData,
          },
          payments: {
            create: {
              amount: totalAmount,
              paymentMethod: dto.paymentMode,
              status: PaymentStatus.COMPLETED,
            },
          },
        },
        include: {
          items: true,
          payments: true,
        },
      } as never);

      for (const [
        productId,
        requiredQuantity,
      ] of requiredQuantities.entries()) {
        const product = productById.get(productId)!;

        const updatedProduct = await tx.product.update({
          where: {
            id: productId,
          },
          data: {
            currentStock: product.currentStock - requiredQuantity,
          },
        } as never);

        await this.alertsPort.syncProductAlerts(tx, updatedProduct);

        await tx.stockMovement.create({
          data: {
            productId,
            type: MovementType.OUT,
            qtyDelta: -requiredQuantity,
            reason: `Sale #${receiptNumber}`,
            createdBy: userId,
          },
        } as never);
      }

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'CREATE_SALE',
          entityType: 'SALE',
          entityId: sale.id,
          payload: {
            receiptNumber,
            paymentMode: dto.paymentMode,
            subtotal,
            totalAmount,
            items: saleItemsData,
          },
        },
      } as never);

      return this.getSaleDetail(tx, shopId, sale.id) as Promise<SaleDetail>;
    });
  }

  private aggregateRequestedQuantities(dto: CreateSaleDto) {
    const requiredQuantities = new Map<string, number>();

    for (const item of dto.items) {
      const currentQuantity = requiredQuantities.get(item.productId) ?? 0;
      requiredQuantities.set(item.productId, currentQuantity + item.quantity);
    }

    return requiredQuantities;
  }

  private buildTopProducts(saleItems: SummarySaleItem[]) {
    const topProductsMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        quantitySold: number;
        revenue: number;
      }
    >();

    for (const item of saleItems) {
      const existingEntry = topProductsMap.get(item.productId);
      const lineRevenue = item.qty * item.unitPrice - (item.discount ?? 0);

      if (existingEntry) {
        existingEntry.quantitySold += item.qty;
        existingEntry.revenue += lineRevenue;
        continue;
      }

      topProductsMap.set(item.productId, {
        productId: item.productId,
        productName: item.product.name,
        quantitySold: item.qty,
        revenue: lineRevenue,
      });
    }

    return Array.from(topProductsMap.values())
      .sort((left, right) => {
        if (right.quantitySold !== left.quantitySold) {
          return right.quantitySold - left.quantitySold;
        }

        return right.revenue - left.revenue;
      })
      .slice(0, MAX_TOP_PRODUCTS);
  }

  private getSaleDetail(
    prismaClient: Prisma.TransactionClient | PrismaService,
    shopId: string,
    saleId: string,
  ) {
    return prismaClient.sale.findFirst({
      where: {
        id: saleId,
        shopId,
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                unit: true,
              },
            },
          },
        },
        payments: true,
      },
    } as never) as Promise<SaleDetail | null>;
  }

  private buildSaleListWhereClause(
    shopId: string,
    query: GetSalesQueryDto,
  ): Prisma.SaleWhereInput {
    const soldAt = this.buildSoldAtDateFilter(query);

    return {
      shopId,
      ...(soldAt ? { soldAt } : {}),
    };
  }

  private buildSoldAtDateFilter(query: GetSalesQueryDto) {
    if (!query.from && !query.to) {
      return undefined;
    }

    const soldAtFilter: Prisma.DateTimeFilter = {};

    if (query.from) {
      soldAtFilter.gte = this.normalizeStartDate(query.from);
    }

    if (query.to) {
      soldAtFilter.lte = this.normalizeEndDate(query.to);
    }

    return soldAtFilter;
  }

  private generateReceiptNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const shortUuid = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

    return `MAH-${datePart}-${shortUuid}`;
  }

  private resolveSummaryWindow(
    timeZone: string,
    query: GetDailySalesSummaryQueryDto,
  ) {
    const today = this.getCurrentDateInTimeZone(timeZone);
    const fromDate = query.from ?? query.to ?? today;
    const toDate = query.to ?? query.from ?? today;

    return {
      start: this.createTimeZoneBoundary(fromDate, timeZone, 'start'),
      end: this.createTimeZoneBoundary(toDate, timeZone, 'end'),
      label: fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`,
    };
  }

  private normalizeStartDate(value: string) {
    const date = new Date(value);

    if (this.isDateOnlyValue(value)) {
      date.setUTCHours(0, 0, 0, 0);
    }

    return date;
  }

  private normalizeEndDate(value: string) {
    const date = new Date(value);

    if (this.isDateOnlyValue(value)) {
      date.setUTCHours(23, 59, 59, 999);
    }

    return date;
  }

  private isDateOnlyValue(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
