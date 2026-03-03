import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { StockStatus } from '../../../common/enums';

@Injectable()
export class StockExpiryJob {
  private readonly logger = new Logger(StockExpiryJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs daily at 02:00 AM server time.
   * Marks stock items as EXPIRED if expiryDate has passed.
   * Marks stock items as LOW_STOCK if quantity <= minQuantity.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'stock-expiry-check' })
  async handleStockExpiryCheck() {
    this.logger.log('⏰ Running stock expiry check...');
    const now = new Date();

    // Mark expired items
    const expiredResult = await this.prisma.stockItem.updateMany({
      where: {
        expiryDate: { lte: now },
        status: { not: StockStatus.EXPIRED },
      },
      data: { status: StockStatus.EXPIRED },
    });

    // Mark LOW_STOCK items
    const lowStockResult = await this.prisma.stockItem.updateMany({
      where: {
        quantity: { gt: 0 },
        status: { not: StockStatus.EXPIRED },
        // quantity <= minQuantity — Prisma can't compare two columns directly, use raw
      },
      data: {}, // Placeholder — real low-stock logic via raw query below
    });

    // Using raw query to compare quantity against minQuantity column
    await this.prisma.$executeRaw`
      UPDATE stock_items
      SET status = ${StockStatus.LOW_STOCK}
      WHERE quantity > 0
        AND quantity <= "minQuantity"
        AND status NOT IN (${StockStatus.EXPIRED}, ${StockStatus.OUT_OF_STOCK})
    `;

    await this.prisma.$executeRaw`
      UPDATE stock_items
      SET status = ${StockStatus.OUT_OF_STOCK}
      WHERE quantity = 0
        AND status != ${StockStatus.EXPIRED}
    `;

    await this.prisma.$executeRaw`
      UPDATE stock_items
      SET status = ${StockStatus.IN_STOCK}
      WHERE quantity > "minQuantity"
        AND status NOT IN (${StockStatus.EXPIRED})
        AND "expiryDate" IS NULL OR "expiryDate" > NOW()
    `;

    this.logger.log(
      `✅ Stock check done — expired: ${expiredResult.count}, processed low-stock update`,
    );
  }
}
