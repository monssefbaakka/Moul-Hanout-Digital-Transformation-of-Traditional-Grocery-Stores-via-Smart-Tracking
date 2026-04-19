import {
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
import { CreateSaleDto, GetSalesQueryDto } from './dto/sale.dto';

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

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

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

      const productById = new Map(products.map((product) => [product.id, product]));
      const requiredQuantities = this.aggregateRequestedQuantities(dto);

      for (const [productId, requiredQuantity] of requiredQuantities.entries()) {
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

      for (const [productId, requiredQuantity] of requiredQuantities.entries()) {
        const product = productById.get(productId)!;

        await tx.product.update({
          where: {
            id: productId,
          },
          data: {
            currentStock: product.currentStock - requiredQuantity,
          },
        } as never);

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

      return (await tx.sale.findUnique({
        where: {
          id: sale.id,
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
      } as never)) as Prisma.SaleGetPayload<{
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
}
