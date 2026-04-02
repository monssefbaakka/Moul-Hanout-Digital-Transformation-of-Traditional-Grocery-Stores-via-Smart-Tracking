import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/database/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  password: string;
  name: string;
  shopRoles: { role: Role, shopId?: string }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

function pickSelected<T extends Record<string, unknown>>(record: T | null, select?: Record<string, boolean>) {
  if (!record) return null;
  if (!select) return { ...record };

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled)
      .map(([key]) => [key, record[key]]),
  );
}

async function createPrismaMock() {
  const now = new Date('2026-03-18T00:00:00.000Z');
  const ownerPassword = await bcrypt.hash('Admin@123!', 12);
  const cashierPassword = await bcrypt.hash('Cashier@123!', 12);

  const users: UserRecord[] = [
    {
      id: 'user-owner',
      email: 'owner@moulhanout.ma',
      password: ownerPassword,
      name: 'Store Owner',
      shopRoles: [{ role: Role.OWNER, shopId: 'default-shop-id' }],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-cashier',
      email: 'cashier@moulhanout.ma',
      password: cashierPassword,
      name: 'Default Cashier',
      shopRoles: [{ role: Role.CASHIER, shopId: 'default-shop-id' }],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const sessions: SessionRecord[] = [];

  return {
    user: {
      findUnique: jest.fn(async (args: any) => {
        const match = users.find((user) => {
          if (args.where.email) return user.email === args.where.email;
          if (args.where.id) return user.id === args.where.id;
          return false;
        });

        return pickSelected(match ?? null, args.select);
      }),
      findMany: jest.fn(async (args?: any) => {
        return users.map((user) => pickSelected(user, args?.select));
      }),
      create: jest.fn(async (args: any) => {
        const createdAt = new Date();
        const user: UserRecord = {
          id: `user-${users.length + 1}`,
          email: args.data.email,
          password: args.data.password,
          name: args.data.name,
          shopRoles: args.data.shopRoles?.create 
            ? [{ role: args.data.shopRoles.create.role, shopId: args.data.shopRoles.create.shopId || 'default-shop-id' }] 
            : [{ role: Role.CASHIER, shopId: 'default-shop-id' }],
          isActive: true,
          createdAt,
          updatedAt: createdAt,
        };
        users.push(user);
        return pickSelected(user, args.select);
      }),
    },
    session: {
      create: jest.fn(async (args: any) => {
        const session: SessionRecord = {
          id: `session-${sessions.length + 1}`,
          userId: args.data.userId,
          token: args.data.token,
          expiresAt: args.data.expiresAt,
          ipAddress: args.data.ipAddress ?? null,
          userAgent: args.data.userAgent ?? null,
          createdAt: new Date(),
        };
        sessions.push(session);
        return { ...session };
      }),
      update: jest.fn(async (args: any) => {
        const session = sessions.find((entry) => entry.id === args.where.id);
        if (!session) {
          throw new Error(`Session ${args.where.id} not found`);
        }

        Object.assign(session, args.data);
        return { ...session };
      }),
      findUnique: jest.fn(async (args: any) => {
        const session = sessions.find((entry) => entry.id === args.where.id);
        if (!session) return null;

        if (args.include?.user) {
          const user = users.find((entry) => entry.id === session.userId) ?? null;
          return {
            ...session,
            user: args.include.user.select ? pickSelected(user, args.include.user.select) : user,
          };
        }

        return pickSelected(session, args.select);
      }),
      deleteMany: jest.fn(async (args: any) => {
        const before = sessions.length;
        for (let index = sessions.length - 1; index >= 0; index -= 1) {
          const session = sessions[index];
          if (session.id === args.where.id && session.userId === args.where.userId) {
            sessions.splice(index, 1);
          }
        }

        return { count: before - sessions.length };
      }),
    },
  };
}

describe('Phase 1 e2e', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/moul_hanout?schema=public';
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const prismaMock = await createPrismaMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(PrismaHealthIndicator)
      .useValue({
        pingCheck: jest.fn(async (key: string) => ({
          [key]: { status: 'up' },
        })),
      })
      .overrideProvider(MemoryHealthIndicator)
      .useValue({
        checkHeap: jest.fn(async (key: string) => ({
          [key]: { status: 'up' },
        })),
      })
      .overrideProvider(HealthCheckService)
      .useValue({
        check: jest.fn(async (checks: Array<() => Promise<Record<string, unknown>>>) => {
          const results = await Promise.all(checks.map((check) => check()));
          const details = Object.assign({}, ...results);
          return {
            status: 'ok',
            info: details,
            error: {},
            details,
          };
        }),
      })
      .overrideProvider('REDIS_CLIENT')
      .useValue({
        on: jest.fn(),
        quit: jest.fn(),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns an ok response', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('POST /api/v1/auth/register creates a cashier account', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'New Cashier',
        email: 'new.cashier@moulhanout.ma',
        password: 'Cashier@123!',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('new.cashier@moulhanout.ma');
    expect(response.body.data.role).toBe(Role.CASHIER);
  });

  it('POST /api/v1/auth/login returns a token pair for seeded users', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@moulhanout.ma',
        password: 'Admin@123!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(typeof response.body.data.refreshToken).toBe('string');
  });

  it('GET /api/v1/users requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('GET /api/v1/users allows an authenticated owner', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@moulhanout.ma',
        password: 'Admin@123!',
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken as string;

    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  it('POST /api/v1/auth/login fails with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@moulhanout.ma',
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('GET /api/v1/users denies an authenticated cashier', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'cashier@moulhanout.ma',
        password: 'Cashier@123!',
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken as string;

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
