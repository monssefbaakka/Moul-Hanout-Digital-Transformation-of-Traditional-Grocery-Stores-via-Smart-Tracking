import { AlertType, Role } from '@prisma/client';
import { AlertsEmailNotifierService } from './alerts-email-notifier.service';

describe('AlertsEmailNotifierService', () => {
  const prisma = {
    shop: {
      findMany: jest.fn(),
    },
    alert: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  const alertsService = {
    syncShopAlerts: jest.fn(),
  };

  const mailService = {
    isMailEnabled: jest.fn(),
    sendInventoryAlertEmail: jest.fn(),
  };

  let service: AlertsEmailNotifierService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlertsEmailNotifierService(
      prisma as never,
      alertsService as never,
      mailService as never,
    );
  });

  it('skips processing when SMTP mail is not configured', async () => {
    mailService.isMailEnabled.mockReturnValue(false);

    await service.processPendingAlertEmails();

    expect(prisma.shop.findMany).not.toHaveBeenCalled();
  });

  it('sends pending low-stock and expiry alerts to owner recipients and marks them delivered', async () => {
    mailService.isMailEnabled.mockReturnValue(true);
    prisma.shop.findMany.mockResolvedValueOnce([
      { id: 'shop-1', name: 'Main Shop' },
    ]);
    prisma.alert.findMany.mockResolvedValueOnce([
      {
        id: 'alert-1',
        type: AlertType.LOW_STOCK,
        product: {
          name: 'Milk 1L',
          currentStock: 2,
          lowStockThreshold: 5,
          expirationDate: new Date('2026-04-25T00:00:00.000Z'),
          isActive: true,
        },
      },
      {
        id: 'alert-2',
        type: AlertType.EXPIRY,
        product: {
          name: 'Yogurt',
          currentStock: 4,
          lowStockThreshold: 3,
          expirationDate: new Date('2026-04-24T00:00:00.000Z'),
          isActive: true,
        },
      },
    ]);
    prisma.user.findMany.mockResolvedValueOnce([
      {
        email: 'owner@moulhanout.ma',
        name: 'Store Owner',
        shopRoles: [{ role: Role.OWNER }],
      },
    ]);

    await service.processPendingAlertEmails();

    expect(alertsService.syncShopAlerts).toHaveBeenCalledWith('shop-1');
    expect(mailService.sendInventoryAlertEmail).toHaveBeenCalledWith(
      'owner@moulhanout.ma',
      expect.objectContaining({
        shopName: 'Main Shop',
        recipientName: 'Store Owner',
        lowStock: [
          expect.objectContaining({
            productName: 'Milk 1L',
            currentStock: 2,
          }),
        ],
        expiringSoon: [
          expect.objectContaining({
            productName: 'Yogurt',
            expirationDate: '2026-04-24T00:00:00.000Z',
          }),
        ],
      }),
    );
    expect(prisma.alert.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.alert.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: ['alert-1', 'alert-2'],
          },
        },
      }),
    );
  });
});
