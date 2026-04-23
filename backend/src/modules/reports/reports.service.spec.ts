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
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
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
          lt: new Date('2026-01-15T23:00:00.000Z'),
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

  it('returns an aggregated dashboard payload for the current shop day', async () => {
    const now = new Date('2026-01-15T10:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    try {
      prisma.shop.findUnique.mockResolvedValue({
        timezone: 'Africa/Casablanca',
      });
      prisma.sale.count.mockResolvedValue(3);
      prisma.sale.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: 420,
        },
      });
      prisma.product.count.mockResolvedValue(18);
      prisma.product.findMany
        .mockResolvedValueOnce([
          {
            id: 'product-low',
            name: 'Milk',
            currentStock: 2,
            lowStockThreshold: 5,
            unit: 'bottle',
            category: { name: 'Fresh' },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'product-expiring',
            name: 'Yogurt',
            currentStock: 4,
            lowStockThreshold: 3,
            unit: 'cup',
            expirationDate: new Date('2026-01-18T00:00:00.000Z'),
            category: { name: 'Fresh' },
          },
        ]);
      prisma.sale.findMany
        .mockResolvedValueOnce([
          {
            soldAt: new Date('2026-01-09T10:15:00.000Z'),
            totalAmount: 110,
          },
          {
            soldAt: new Date('2026-01-14T23:30:00.000Z'),
            totalAmount: 310,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'sale-1',
            receiptNumber: 'MAH-20260115-AAAA1111',
            soldAt: new Date('2026-01-15T09:00:00.000Z'),
            status: 'COMPLETED',
            paymentMode: 'CASH',
            totalAmount: 220,
            cashier: { name: 'Amina' },
            items: [{ qty: 2 }, { qty: 1 }],
          },
        ]);

      const report = await service.getDashboard('shop-1');

      expect(prisma.sale.count).toHaveBeenCalledWith({
        where: {
          shopId: 'shop-1',
          status: 'COMPLETED',
          soldAt: {
            gte: new Date('2026-01-14T23:00:00.000Z'),
            lt: new Date('2026-01-15T23:00:00.000Z'),
          },
        },
      });
      expect(prisma.sale.aggregate).toHaveBeenCalledWith({
        where: {
          shopId: 'shop-1',
          status: 'COMPLETED',
          soldAt: {
            gte: new Date('2026-01-14T23:00:00.000Z'),
            lt: new Date('2026-01-15T23:00:00.000Z'),
          },
        },
        _sum: {
          totalAmount: true,
        },
      });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: {
          shopId: 'shop-1',
          isActive: true,
        },
      });
      expect(report).toEqual({
        generatedAt: '2026-01-15T10:00:00.000Z',
        businessDate: '2026-01-15',
        dailySalesTotal: 420,
        dailySalesCount: 3,
        totalProducts: 18,
        lowStockProducts: [
          {
            id: 'product-low',
            name: 'Milk',
            currentStock: 2,
            lowStockThreshold: 5,
            unit: 'bottle',
            categoryName: 'Fresh',
          },
        ],
        expiringProducts: [
          {
            id: 'product-expiring',
            name: 'Yogurt',
            currentStock: 4,
            lowStockThreshold: 3,
            unit: 'cup',
            categoryName: 'Fresh',
            expirationDate: '2026-01-18T00:00:00.000Z',
          },
        ],
        salesTrend: [
          {
            date: '2026-01-09',
            revenue: 110,
            transactions: 1,
          },
          {
            date: '2026-01-15',
            revenue: 310,
            transactions: 1,
          },
        ],
        recentSales: [
          {
            id: 'sale-1',
            receiptNumber: 'MAH-20260115-AAAA1111',
            soldAt: '2026-01-15T09:00:00.000Z',
            status: 'COMPLETED',
            paymentMode: 'CASH',
            cashierName: 'Amina',
            total: 220,
            itemCount: 3,
          },
        ],
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
