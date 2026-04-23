import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlertType, Prisma, Role as PrismaRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { AlertsService } from './alerts.service';

const pendingAlertInclude = {
  product: {
    select: {
      name: true,
      currentStock: true,
      lowStockThreshold: true,
      expirationDate: true,
      isActive: true,
    },
  },
} satisfies Prisma.AlertInclude;

type PendingAlert = Prisma.AlertGetPayload<{
  include: typeof pendingAlertInclude;
}>;

@Injectable()
export class AlertsEmailNotifierService {
  private readonly logger = new Logger(AlertsEmailNotifierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 */15 * * * *')
  async processScheduledAlertEmails() {
    await this.processPendingAlertEmails();
  }

  async processPendingAlertEmails() {
    if (!this.mailService.isMailEnabled()) {
      return;
    }

    const shops = await this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    for (const shop of shops) {
      await this.alertsService.syncShopAlerts(shop.id);

      const pendingAlerts = await this.prisma.alert.findMany({
        where: {
          shopId: shop.id,
          emailSentAt: null,
          type: {
            in: [AlertType.LOW_STOCK, AlertType.EXPIRY],
          },
          product: {
            isActive: true,
          },
        },
        include: pendingAlertInclude,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      if (pendingAlerts.length === 0) {
        continue;
      }

      const recipients = await this.prisma.user.findMany({
        where: {
          isActive: true,
          shopRoles: {
            some: {
              shopId: shop.id,
              role: PrismaRole.OWNER,
            },
          },
        },
        select: {
          email: true,
          name: true,
        },
      });

      if (recipients.length === 0) {
        this.logger.warn(
          `Skipping alert emails for shop ${shop.id} because no active owner recipients were found.`,
        );
        continue;
      }

      const lowStock = pendingAlerts
        .filter((alert) => alert.type === AlertType.LOW_STOCK)
        .map((alert) => this.toInventoryAlertItem(alert));

      const expiringSoon = pendingAlerts
        .filter((alert) => alert.type === AlertType.EXPIRY)
        .map((alert) => this.toInventoryAlertItem(alert));

      for (const recipient of recipients) {
        await this.mailService.sendInventoryAlertEmail(recipient.email, {
          shopName: shop.name,
          recipientName: recipient.name,
          lowStock,
          expiringSoon,
        });
      }

      await this.prisma.alert.updateMany({
        where: {
          id: {
            in: pendingAlerts.map((alert) => alert.id),
          },
        },
        data: {
          emailSentAt: new Date(),
        },
      });
    }
  }

  private toInventoryAlertItem(alert: PendingAlert) {
    return {
      productName: alert.product.name,
      currentStock: alert.product.currentStock,
      lowStockThreshold: alert.product.lowStockThreshold,
      expirationDate: alert.product.expirationDate?.toISOString() ?? null,
    };
  }
}
