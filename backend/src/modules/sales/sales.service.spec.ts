import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMode, PaymentStatus, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ALERTS_PORT } from '../alerts/alerts.port';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;

  const tx = {
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(),
  };

  const alertsPort = {
    syncProductAlerts: jest.fn(),
    syncShopAlerts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ALERTS_PORT, useValue: alertsPort },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('stores the computed line total for each created sale item', async () => {
    tx.product.findMany.mockResolvedValue([
      {
        id: 'product-1',
        shopId: 'shop-1',
        name: 'Water 1L',
        salePrice: 6,
        currentStock: 10,
      },
    ]);
    tx.sale.create.mockResolvedValue({
      id: 'sale-1',
    });
    tx.product.update.mockResolvedValue({
      id: 'product-1',
      shopId: 'shop-1',
      name: 'Water 1L',
      currentStock: 7,
      lowStockThreshold: 5,
      expirationDate: null,
    });
    tx.sale.findFirst.mockResolvedValue({
      id: 'sale-1',
      shopId: 'shop-1',
      cashierUserId: 'user-1',
      receiptNumber: 'MAH-20260423-ABC12345',
      subtotal: 18,
      totalAmount: 18,
      status: SaleStatus.COMPLETED,
      paymentMode: PaymentMode.CASH,
      soldAt: new Date('2026-04-23T10:00:00.000Z'),
      cashier: {
        id: 'user-1',
        name: 'Cashier',
        email: 'cashier@example.com',
      },
      items: [
        {
          id: 'item-1',
          saleId: 'sale-1',
          productId: 'product-1',
          qty: 3,
          unitPrice: 6,
          lineTotal: 18,
          discount: 0,
          product: {
            id: 'product-1',
            name: 'Water 1L',
            barcode: 'WATER-001',
            unit: 'bottle',
          },
        },
      ],
      payments: [
        {
          id: 'payment-1',
          saleId: 'sale-1',
          amount: 18,
          paymentMethod: PaymentMode.CASH,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date('2026-04-23T10:00:00.000Z'),
        },
      ],
    });

    const sale = await service.create('shop-1', 'user-1', {
      paymentMode: PaymentMode.CASH,
      items: [
        {
          productId: 'product-1',
          quantity: 3,
        },
      ],
    });

    expect(tx.sale.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shopId: 'shop-1',
        cashierUserId: 'user-1',
        subtotal: 18,
        totalAmount: 18,
        status: SaleStatus.COMPLETED,
        paymentMode: PaymentMode.CASH,
        items: {
          create: [
            {
              productId: 'product-1',
              qty: 3,
              unitPrice: 6,
              lineTotal: 18,
              discount: 0,
            },
          ],
        },
        payments: {
          create: {
            amount: 18,
            paymentMethod: PaymentMode.CASH,
            status: PaymentStatus.COMPLETED,
          },
        },
      }),
    });
    expect(sale?.items[0]).toMatchObject({
      qty: 3,
      unitPrice: 6,
      lineTotal: 18,
    });
  });
});
