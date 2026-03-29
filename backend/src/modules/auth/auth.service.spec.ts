import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
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
    },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
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
      role: Role.OWNER,
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

  it('login fails when the password does not match the stored hash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@moulhanout.ma',
      password: 'stored-password',
      name: 'Owner',
      role: Role.OWNER,
      isActive: true,
      createdAt: new Date('2026-03-16T00:00:00.000Z'),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'owner@moulhanout.ma',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
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
        role: Role.OWNER,
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

    await service.logout('user-1', 'session-1', 'Bearer access-token');

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1' },
    });
  });

  it('returns token validation metadata for a valid access token', async () => {
    jwt.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      exp: 1890000000,
    });
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        role: Role.OWNER,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    });

    const result = await service.validateAccessToken('access-token');

    expect(result).toEqual({
      valid: true,
      user: {
        id: 'user-1',
        email: 'owner@moulhanout.ma',
        name: 'Owner',
        role: Role.OWNER,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
      sessionId: 'session-1',
      expiresAt: new Date(1890000000 * 1000).toISOString(),
    });
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
        role: Role.OWNER,
        isActive: true,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
