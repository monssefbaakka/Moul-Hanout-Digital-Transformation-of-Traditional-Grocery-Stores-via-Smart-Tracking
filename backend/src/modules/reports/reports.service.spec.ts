import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const prisma = {
    shop: {
      findUnique: jest.fn(),
    },
    sale: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('groups sales by the shop local date instead of UTC date', async () => {
    prisma.shop.findUnique.mockResolvedValue({
      timezone: 'Africa/Casablanca',
    });
    prisma.sale.findMany.mockResolvedValue([
      {
        soldAt: new Date('2026-01-14T23:30:00.000Z'),
        totalAmount: 125,
      },
      {
        soldAt: new Date('2026-01-15T10:15:00.000Z'),
        totalAmount: 75,
      },
    ]);

    const report = await service.getSalesReport('shop-1', {
      from: '2026-01-15',
      to: '2026-01-15',
    });

    expect(prisma.sale.findMany).toHaveBeenCalledWith({
      where: {
        shopId: 'shop-1',
        status: 'COMPLETED',
        soldAt: {
          gte: new Date('2026-01-14T23:00:00.000Z'),
          lte: new Date('2026-01-15T23:00:00.998Z'),
        },
      },
      select: { soldAt: true, totalAmount: true },
    });
    expect(report).toEqual({
      days: [
        {
          date: '2026-01-15',
          revenue: 200,
          transactions: 2,
        },
      ],
      totalRevenue: 200,
      totalTransactions: 2,
    });
  });

  it('exports CSV using the same shop-local aggregation as the sales report', async () => {
    prisma.shop.findUnique.mockResolvedValue({
      timezone: 'Africa/Casablanca',
    });
    prisma.sale.findMany.mockResolvedValue([
      {
        soldAt: new Date('2026-01-14T23:30:00.000Z'),
        totalAmount: 125,
      },
    ]);

    const csv = await service.exportSalesCsv('shop-1', {
      from: '2026-01-15',
      to: '2026-01-15',
    });

    expect(csv).toBe(
      [
        'Date,Revenu (MAD),Transactions',
        '2026-01-15,125.00,1',
        'Total,125.00,1',
      ].join('\n'),
    );
  });

  it('rejects sales reports when the shop cannot be found', async () => {
    prisma.shop.findUnique.mockResolvedValue(null);

    await expect(
      service.getSalesReport('missing-shop', {
        from: '2026-01-15',
        to: '2026-01-15',
      }),
    ).rejects.toThrow(new NotFoundException('Shop not found'));
  });
});
