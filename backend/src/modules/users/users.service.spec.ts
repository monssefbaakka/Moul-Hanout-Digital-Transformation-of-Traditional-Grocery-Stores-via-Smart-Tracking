import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  it('returns the authenticated user profile for the active shop', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Store Owner',
      email: 'owner@moulhanout.ma',
      shopRoles: [{ role: 'OWNER', shopId: 'shop-1' }],
      isActive: true,
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });

    await expect(service.findProfile('shop-1', 'user-1')).resolves.toEqual({
      id: 'user-1',
      name: 'Store Owner',
      email: 'owner@moulhanout.ma',
      role: 'OWNER',
      isActive: true,
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });
  });

  it('updates the profile email and normalizes it to lowercase', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Store Owner',
      email: 'owner@moulhanout.ma',
      shopRoles: [{ role: 'OWNER', shopId: 'shop-1' }],
      isActive: true,
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Store Owner',
      email: 'new-owner@moulhanout.ma',
      shopRoles: [{ role: 'OWNER', shopId: 'shop-1' }],
      isActive: true,
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });

    await expect(
      service.updateProfile('shop-1', 'user-1', {
        email: 'New-Owner@MoulHanout.ma',
      }),
    ).resolves.toMatchObject({
      email: 'new-owner@moulhanout.ma',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          email: 'new-owner@moulhanout.ma',
        },
      }),
    );
  });

  it('rejects profile email updates when the email already belongs to another user', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Store Owner',
      email: 'owner@moulhanout.ma',
      shopRoles: [{ role: 'OWNER', shopId: 'shop-1' }],
      isActive: true,
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
    });

    await expect(
      service.updateProfile('shop-1', 'user-1', {
        email: 'cashier@moulhanout.ma',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the profile does not belong to the requested shop', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.findProfile('shop-1', 'missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
