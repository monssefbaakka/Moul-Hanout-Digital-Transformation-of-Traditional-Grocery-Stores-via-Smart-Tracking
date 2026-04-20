import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type AlertSyncProduct = {
  id: string;
  shopId: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  expirationDate?: Date | null;
};

export interface AlertsPort {
  syncProductAlerts(
    prismaClient: Prisma.TransactionClient | PrismaService,
    product: AlertSyncProduct,
  ): Promise<void>;
  syncShopAlerts(shopId: string): Promise<void>;
}

export const ALERTS_PORT = Symbol('ALERTS_PORT');
