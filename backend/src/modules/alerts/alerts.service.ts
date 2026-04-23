import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AlertSyncProduct, AlertsPort } from './alerts.port';

const ALERT_EXPIRY_DAYS = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MANAGED_ALERT_TYPES = [AlertType.LOW_STOCK, AlertType.EXPIRY] as const;

const alertProductSelect = {
  id: true,
  name: true,
  currentStock: true,
  lowStockThreshold: true,
  expirationDate: true,
  isActive: true,
} satisfies Prisma.ProductSelect;

const alertWithProductInclude = {
  product: {
    select: alertProductSelect,
  },
} satisfies Prisma.AlertInclude;

type AlertWithProduct = Prisma.AlertGetPayload<{
  include: typeof alertWithProductInclude;
}>;

const alertSyncProductSelect = {
  id: true,
  shopId: true,
  name: true,
  currentStock: true,
  lowStockThreshold: true,
  expirationDate: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class AlertsService implements AlertsPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(shopId: string) {
    await this.syncShopAlerts(shopId);

    const alerts = await this.prisma.alert.findMany({
      where: {
        shopId,
      },
      include: alertWithProductInclude,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    });

    return alerts
      .filter((alert) => alert.product.isActive)
      .map((alert) => this.toAlertItem(alert));
  }

  async markAsRead(shopId: string, alertId: string) {
    const existingAlert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        shopId,
      },
      select: {
        id: true,
      },
    });

    if (!existingAlert) {
      throw new NotFoundException('Alert not found');
    }

    const updatedAlert = await this.prisma.alert.update({
      where: {
        id: alertId,
      },
      data: {
        isRead: true,
      },
      include: alertWithProductInclude,
    });

    return this.toAlertItem(updatedAlert);
  }

  async syncShopAlerts(shopId: string) {
    const [products, existingAlerts] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          shopId,
          isActive: true,
        },
        select: alertSyncProductSelect,
      }),
      this.prisma.alert.findMany({
        where: {
          shopId,
          type: {
            in: [...MANAGED_ALERT_TYPES],
          },
        },
      }),
    ]);

    const activeProductIds = new Set(products.map((product) => product.id));
    const staleAlertIds = existingAlerts
      .filter((alert) => !activeProductIds.has(alert.productId))
      .map((alert) => alert.id);

    if (staleAlertIds.length > 0) {
      await this.prisma.alert.deleteMany({
        where: {
          id: {
            in: staleAlertIds,
          },
        },
      });
    }

    const alertsByProductId = new Map<string, typeof existingAlerts>();

    for (const alert of existingAlerts) {
      if (!activeProductIds.has(alert.productId)) {
        continue;
      }

      const currentAlerts = alertsByProductId.get(alert.productId) ?? [];
      currentAlerts.push(alert);
      alertsByProductId.set(alert.productId, currentAlerts);
    }

    for (const product of products) {
      await this.reconcileProductAlerts(
        this.prisma,
        product,
        alertsByProductId.get(product.id) ?? [],
      );
    }
  }

  async syncProductAlerts(
    prismaClient: Prisma.TransactionClient | PrismaService,
    product: AlertSyncProduct,
  ) {
    const existingAlerts = await prismaClient.alert.findMany({
      where: {
        shopId: product.shopId,
        productId: product.id,
        type: {
          in: [...MANAGED_ALERT_TYPES],
        },
      },
    });

    await this.reconcileProductAlerts(prismaClient, product, existingAlerts);
  }

  private async reconcileProductAlerts(
    prismaClient: Prisma.TransactionClient | PrismaService,
    product: AlertSyncProduct,
    existingAlerts: Array<{
      id: string;
      type: AlertType;
      message: string;
      shopId: string;
      productId: string;
      isRead: boolean;
      createdAt: Date;
    }>,
  ) {
    const desiredAlerts = this.buildDesiredAlerts(product);
    const alertsByType = new Map<AlertType, typeof existingAlerts>();

    for (const alert of existingAlerts) {
      const currentAlerts = alertsByType.get(alert.type) ?? [];
      currentAlerts.push(alert);
      alertsByType.set(alert.type, currentAlerts);
    }

    for (const type of MANAGED_ALERT_TYPES) {
      const currentAlerts = alertsByType.get(type) ?? [];
      const [primaryAlert, ...duplicateAlerts] = currentAlerts;
      const desiredMessage = desiredAlerts.get(type);

      if (!desiredMessage) {
        if (currentAlerts.length > 0) {
          await prismaClient.alert.deleteMany({
            where: {
              id: {
                in: currentAlerts.map((alert) => alert.id),
              },
            },
          });
        }
        continue;
      }

      if (!primaryAlert) {
        await prismaClient.alert.create({
          data: {
            shopId: product.shopId,
            productId: product.id,
            type,
            message: desiredMessage,
            emailSentAt: null,
          },
        });
        continue;
      }

      if (primaryAlert.message !== desiredMessage) {
        await prismaClient.alert.update({
          where: {
            id: primaryAlert.id,
          },
          data: {
            message: desiredMessage,
            isRead: false,
            emailSentAt: null,
          },
        });
      }

      if (duplicateAlerts.length > 0) {
        await prismaClient.alert.deleteMany({
          where: {
            id: {
              in: duplicateAlerts.map((alert) => alert.id),
            },
          },
        });
      }
    }
  }

  private buildDesiredAlerts(product: AlertSyncProduct) {
    const desiredAlerts = new Map<AlertType, string>();

    if (product.currentStock <= product.lowStockThreshold) {
      desiredAlerts.set(
        AlertType.LOW_STOCK,
        `Stock bas pour ${product.name}: ${product.currentStock} unite(s) restantes sur un seuil de ${product.lowStockThreshold}.`,
      );
    }

    if (
      product.currentStock > 0 &&
      this.isExpiringSoon(product.expirationDate)
    ) {
      desiredAlerts.set(
        AlertType.EXPIRY,
        `Expiration proche pour ${product.name}: lot a verifier avant le ${this.formatDate(product.expirationDate!)}.`,
      );
    }

    return desiredAlerts;
  }

  private isExpiringSoon(expirationDate?: Date | null) {
    if (!expirationDate) {
      return false;
    }

    const timeUntilExpiry = expirationDate.getTime() - Date.now();

    return (
      timeUntilExpiry >= 0 &&
      timeUntilExpiry <= ALERT_EXPIRY_DAYS * MILLISECONDS_PER_DAY
    );
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private toAlertItem(alert: AlertWithProduct) {
    return {
      id: alert.id,
      type: alert.type,
      message: alert.message,
      isRead: alert.isRead,
      createdAt: alert.createdAt.toISOString(),
      productId: alert.product.id,
      productName: alert.product.name,
      productCurrentStock: alert.product.currentStock,
      productLowStockThreshold: alert.product.lowStockThreshold,
      expirationDate: alert.product.expirationDate?.toISOString() ?? null,
    };
  }
}
