import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enums';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  const jwt = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const config = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.secret': 'access-secret',
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
      };

      return values[key];
    }),
    get: jest.fn((key: string) => {
      const values: Record<string, string | number> = {
        'app.env': 'development',
        'app.frontendUrl': 'http://localhost:3000',
        'auth.passwordResetExpiresInMinutes': 30,
      };

      return values[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('logs in a user and persists the hashed refresh token in the session', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@moulhanout.ma',
      password: 'stored-password',
      name: 'Owner',
      shopRoles: [{ role: Role.OWNER, shopId: 'shop-1' }],
      isActive: true,
      createdAt: new Date('2026-03-16T00:00:00.000Z'),
    });
    prisma.session.create.mockResolvedValue({ id: 'session-1' });
    prisma.session.update.mockResolvedValue({});
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
    jwt.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');
    jwt.decode.mockReturnValue({ exp: 1770000000 });

    const result = await service.login({
      email: 'owner@moulhanout.ma',
      password: 'Admin@123!',
    });

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        role: Role.OWNER,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        token: 'hashed-refresh-token',
        expiresAt: new Date(1770000000 * 1000),
      },
    });
  });

  it('fails to log in when the password is incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@moulhanout.ma',
      password: 'stored-password',
      name: 'Owner',
      shopRoles: [{ role: Role.OWNER, shopId: 'shop-1' }],
      isActive: true,
      createdAt: new Date('2026-03-16T00:00:00.000Z'),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'owner@moulhanout.ma',
        password: 'WrongPassword@123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('fails to log in when the user has no shop assignment', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@moulhanout.ma',
      password: 'stored-password',
      name: 'Owner',
      shopRoles: [],
      isActive: true,
      createdAt: new Date('2026-03-16T00:00:00.000Z'),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login({
        email: 'owner@moulhanout.ma',
        password: 'Admin@123!',
      }),
    ).rejects.toThrow(new UnauthorizedException('User has no shop assignment'));
  });

  it('rotates tokens during refresh when the stored refresh token hash matches', async () => {
    jwt.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      exp: 1770000000,
    });
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      token: 'stored-hash',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        shopRoles: [{ role: Role.OWNER, shopId: 'shop-1' }],
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    });
    prisma.session.update.mockResolvedValue({});
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('next-hash');
    jwt.sign
      .mockReturnValueOnce('next-access-token')
      .mockReturnValueOnce('next-refresh-token');
    jwt.decode.mockReturnValue({ exp: 1880000000 });

    const result = await service.refresh('refresh-token');

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        role: Role.OWNER,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        token: 'next-hash',
        expiresAt: new Date(1880000000 * 1000),
      },
    });
  });

  it('deletes the current session during logout', async () => {
    prisma.session.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.logout(
      'user-1',
      'session-1',
      'Bearer access-token',
    );

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1' },
    });
    expect(result).toEqual({ message: 'Logged out successfully' });
  });

  it('creates a password reset token and logs a reset link for active users', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@moulhanout.ma',
      isActive: true,
    });
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'reset-1' });

    const loggerSpy = jest
      .spyOn(
        (service as { logger: { log: (message: string) => void } }).logger,
        'log',
      )
      .mockImplementation(() => undefined);

    const result = await service.forgotPassword({
      email: 'owner@moulhanout.ma',
    });

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Password reset link for owner@moulhanout.ma: http://localhost:3000/reset-password?token=',
      ),
    );
    expect(result).toEqual({
      message:
        'If an account exists for that email, a password reset link has been generated.',
    });
  });

  it('returns the generic forgot-password response when the account does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await service.forgotPassword({
      email: 'missing@moulhanout.ma',
    });

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      message:
        'If an account exists for that email, a password reset link has been generated.',
    });
  });

  it('resets the password and revokes all sessions for a valid reset token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      usedAt: null,
      user: {
        isActive: true,
      },
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
    prisma.user.update.mockResolvedValue({});
    prisma.session.deleteMany.mockResolvedValue({ count: 2 });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');

    const result = await service.resetPassword({
      token: 'plain-reset-token',
      password: 'NewPassword@123',
    });

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'reset-1',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        usedAt: expect.any(Date),
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: 'hashed-new-password' },
    });
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result).toEqual({
      message: 'Password reset successful. Please sign in again.',
    });
  });

  it('rejects password reset when the token is invalid or expired', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'invalid-token',
        password: 'NewPassword@123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects refresh when the hashed token does not match the stored session token', async () => {
    jwt.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      exp: 1770000000,
    });
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      token: 'stored-hash',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        shopRoles: [{ role: Role.OWNER, shopId: 'shop-1' }],
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects refresh when the user has no shop assignment', async () => {
    jwt.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      exp: 1770000000,
    });
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      token: 'stored-hash',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        shopRoles: [],
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(service.refresh('refresh-token')).rejects.toThrow(
      new UnauthorizedException('User has no shop assignment'),
    );
  });
});
