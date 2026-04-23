import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { AlertType, MovementType, Role } from '@prisma/client';
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
  shopRoles: { role: Role; shopId: string }[];
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

type CategoryRecord = {
  id: string;
  shopId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
};

type ProductRecord = {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  unit?: string | null;
  photo?: string | null;
  barcode?: string | null;
  salePrice: number;
  costPrice?: number | null;
  lowStockThreshold: number;
  currentStock: number;
  expirationDate?: Date | null;
};

type StockMovementRecord = {
  id: string;
  productId: string;
  type: MovementType;
  qtyDelta: number;
  reason?: string | null;
  createdBy: string;
  createdAt: Date;
};

type AlertRecord = {
  id: string;
  shopId: string;
  type: AlertType;
  productId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

type AuditLogRecord = {
  id: string;
  shopId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown> | null;
  createdAt: Date;
};

function selectFields<T extends Record<string, unknown>>(
  record: T,
  select?: Record<string, any>,
) {
  if (!select) {
    return { ...record };
  }

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => [key, record[key]]),
  );
}

function selectUser(user: UserRecord, args?: any) {
  if (args?.include?.shopRoles) {
    const filteredShopRoles = user.shopRoles.filter((shopRole) => {
      const scopedShopId = args.include.shopRoles.where?.shopId;
      return !scopedShopId || shopRole.shopId === scopedShopId;
    });

    return {
      ...user,
      shopRoles: filteredShopRoles.map((shopRole) =>
        args.include.shopRoles === true
          ? { ...shopRole }
          : selectFields(shopRole, args.include.shopRoles.select),
      ),
    };
  }

  if (args?.select) {
    const selected = selectFields(user, args.select);

    if (args.select.shopRoles) {
      const filteredShopRoles = user.shopRoles.filter((shopRole) => {
        const scopedShopId = args.select.shopRoles.where?.shopId;
        return !scopedShopId || shopRole.shopId === scopedShopId;
      });

      return {
        ...selected,
        shopRoles: filteredShopRoles.map((shopRole) =>
          selectFields(shopRole, args.select.shopRoles.select),
        ),
      };
    }

    return selected;
  }

  return { ...user };
}

function matchUser(user: UserRecord, where?: any) {
  if (!where) {
    return true;
  }

  if (where.email && user.email !== where.email) {
    return false;
  }

  if (where.id && user.id !== where.id) {
    return false;
  }

  if (where.shopRoles?.some?.shopId) {
    return user.shopRoles.some(
      (role) => role.shopId === where.shopRoles.some.shopId,
    );
  }

  return true;
}

function matchCategory(category: CategoryRecord, where?: any) {
  if (!where) {
    return true;
  }

  if (where.id && category.id !== where.id) {
    return false;
  }

  if (where.shopId && category.shopId !== where.shopId) {
    return false;
  }

  if (where.isActive !== undefined && category.isActive !== where.isActive) {
    return false;
  }

  return true;
}

function matchProduct(product: ProductRecord, where?: any) {
  if (!where) {
    return true;
  }

  if (where.id && product.id !== where.id) {
    return false;
  }

  if (where.shopId && product.shopId !== where.shopId) {
    return false;
  }

  if (where.categoryId && product.categoryId !== where.categoryId) {
    return false;
  }

  if (where.barcode !== undefined && product.barcode !== where.barcode) {
    return false;
  }

  if (where.isActive !== undefined && product.isActive !== where.isActive) {
    return false;
  }

  if (where.id?.not && product.id === where.id.not) {
    return false;
  }

  return true;
}

function matchAlert(alert: AlertRecord, where?: any) {
  if (!where) {
    return true;
  }

  if (where.id && typeof where.id === 'string' && alert.id !== where.id) {
    return false;
  }

  if (where.id?.in && !where.id.in.includes(alert.id)) {
    return false;
  }

  if (where.shopId && alert.shopId !== where.shopId) {
    return false;
  }

  if (where.productId && alert.productId !== where.productId) {
    return false;
  }

  if (
    where.type &&
    typeof where.type === 'string' &&
    alert.type !== where.type
  ) {
    return false;
  }

  if (where.type?.in && !where.type.in.includes(alert.type)) {
    return false;
  }

  return true;
}

async function createPrismaMock() {
  const now = new Date('2026-03-18T00:00:00.000Z');
  const expiringSoon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const expiresLater = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
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
    {
      id: 'user-other-shop-owner',
      email: 'other.owner@moulhanout.ma',
      password: ownerPassword,
      name: 'Other Shop Owner',
      shopRoles: [{ role: Role.OWNER, shopId: 'other-shop-id' }],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-unassigned',
      email: 'unassigned@moulhanout.ma',
      password: ownerPassword,
      name: 'Unassigned User',
      shopRoles: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const categories: CategoryRecord[] = [
    {
      id: 'cat-active-1',
      shopId: 'default-shop-id',
      name: 'Boissons',
      description: 'Cold drinks',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'cat-active-2',
      shopId: 'default-shop-id',
      name: 'Snacks',
      description: 'Chips and biscuits',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'cat-inactive',
      shopId: 'default-shop-id',
      name: 'Legacy',
      description: 'Inactive category',
      isActive: false,
      createdAt: now,
    },
    {
      id: 'cat-other-shop',
      shopId: 'other-shop-id',
      name: 'Other Shop Category',
      description: 'Should not leak',
      isActive: true,
      createdAt: now,
    },
  ];

  const products: ProductRecord[] = [
    {
      id: 'product-active',
      shopId: 'default-shop-id',
      categoryId: 'cat-active-1',
      name: 'Water 1L',
      description: 'Bottle',
      isActive: true,
      unit: 'bottle',
      photo: null,
      barcode: 'WATER-001',
      salePrice: 6,
      costPrice: 4,
      lowStockThreshold: 5,
      currentStock: 10,
      expirationDate: expiringSoon,
    },
    {
      id: 'product-inactive',
      shopId: 'default-shop-id',
      categoryId: 'cat-active-2',
      name: 'Old Chips',
      description: 'Inactive product',
      isActive: false,
      unit: 'bag',
      photo: null,
      barcode: 'CHIPS-OLD',
      salePrice: 4,
      costPrice: 2,
      lowStockThreshold: 5,
      currentStock: 3,
      expirationDate: null,
    },
    {
      id: 'product-other-shop',
      shopId: 'other-shop-id',
      categoryId: 'cat-other-shop',
      name: 'Other Shop Juice',
      description: 'Should not leak',
      isActive: true,
      unit: 'bottle',
      photo: null,
      barcode: 'OTHER-001',
      salePrice: 9,
      costPrice: 5,
      lowStockThreshold: 5,
      currentStock: 12,
      expirationDate: expiresLater,
    },
  ];

  const stockMovements: StockMovementRecord[] = [];
  const alerts: AlertRecord[] = [];
  const auditLogs: AuditLogRecord[] = [];
  const sessions: SessionRecord[] = [];

  const getCategory = (categoryId: string) =>
    categories.find((category) => category.id === categoryId) ?? null;
  const getProduct = (productId: string) =>
    products.find((product) => product.id === productId) ?? null;
  const getUser = (userId: string) =>
    users.find((user) => user.id === userId) ?? null;

  const prismaMock: any = {
    user: {
      findUnique: jest.fn(async (args: any) => {
        const user =
          users.find((candidate) => matchUser(candidate, args.where)) ?? null;
        return user ? selectUser(user, args) : null;
      }),
      findFirst: jest.fn(async (args: any) => {
        const user =
          users.find((candidate) => matchUser(candidate, args.where)) ?? null;
        return user ? selectUser(user, args) : null;
      }),
      findMany: jest.fn(async (args?: any) => {
        return users
          .filter((user) => matchUser(user, args?.where))
          .map((user) => selectUser(user, args));
      }),
      create: jest.fn(async (args: any) => {
        const createdAt = new Date();
        const shopId =
          args.data.shopRoles?.create?.shop?.connect?.id ?? 'default-shop-id';
        const user: UserRecord = {
          id: `user-${users.length + 1}`,
          email: args.data.email,
          password: args.data.password,
          name: args.data.name,
          shopRoles: [
            {
              role: args.data.shopRoles?.create?.role ?? Role.CASHIER,
              shopId,
            },
          ],
          isActive: true,
          createdAt,
          updatedAt: createdAt,
        };
        users.push(user);
        return selectUser(user, args);
      }),
      update: jest.fn(async (args: any) => {
        const user = users.find((candidate) => candidate.id === args.where.id);
        if (!user) {
          throw new Error(`User ${args.where.id} not found`);
        }

        Object.assign(user, args.data, { updatedAt: new Date() });
        return selectUser(user, args);
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
        if (!session) {
          return null;
        }

        if (args.include?.user) {
          const user =
            users.find((entry) => entry.id === session.userId) ?? null;
          return {
            ...session,
            user: user ? selectUser(user, args.include.user) : null,
          };
        }

        return selectFields(session, args.select);
      }),
      deleteMany: jest.fn(async (args: any) => {
        const before = sessions.length;
        for (let index = sessions.length - 1; index >= 0; index -= 1) {
          const session = sessions[index];
          if (
            session.id === args.where.id &&
            session.userId === args.where.userId
          ) {
            sessions.splice(index, 1);
          }
        }

        return { count: before - sessions.length };
      }),
    },
    category: {
      findMany: jest.fn(async (args?: any) => {
        return categories
          .filter((category) => matchCategory(category, args?.where))
          .map((category) => ({ ...category }));
      }),
      create: jest.fn(async (args: any) => {
        const category: CategoryRecord = {
          id: `category-${categories.length + 1}`,
          shopId: args.data.shopId,
          name: args.data.name,
          description: args.data.description ?? null,
          isActive: args.data.isActive ?? true,
          createdAt: new Date(),
        };
        categories.push(category);
        return { ...category };
      }),
      findFirst: jest.fn(async (args: any) => {
        const category =
          categories.find((candidate) =>
            matchCategory(candidate, args.where),
          ) ?? null;
        return category ? selectFields(category, args.select) : null;
      }),
      update: jest.fn(async (args: any) => {
        const category = categories.find(
          (candidate) => candidate.id === args.where.id,
        );
        if (!category) {
          throw new Error(`Category ${args.where.id} not found`);
        }

        Object.assign(category, args.data);
        return args.select
          ? selectFields(category, args.select)
          : { ...category };
      }),
    },
    product: {
      findMany: jest.fn(async (args?: any) => {
        return products
          .filter((product) => matchProduct(product, args?.where))
          .map((product) => ({
            ...product,
            ...(args?.include?.category
              ? { category: getCategory(product.categoryId) }
              : {}),
          }));
      }),
      findFirst: jest.fn(async (args: any) => {
        const product =
          products.find((candidate) => matchProduct(candidate, args.where)) ??
          null;
        if (!product) {
          return null;
        }

        if (args.include?.category) {
          return {
            ...product,
            category: getCategory(product.categoryId),
          };
        }

        return args.select
          ? selectFields(product, args.select)
          : { ...product };
      }),
      create: jest.fn(async (args: any) => {
        const product: ProductRecord = {
          id: `product-${products.length + 1}`,
          shopId: args.data.shopId,
          categoryId: args.data.categoryId,
          name: args.data.name,
          description: args.data.description ?? null,
          isActive: args.data.isActive ?? true,
          unit: args.data.unit ?? null,
          photo: args.data.photo ?? null,
          barcode: args.data.barcode ?? null,
          salePrice: args.data.salePrice,
          costPrice: args.data.costPrice ?? null,
          lowStockThreshold: args.data.lowStockThreshold ?? 5,
          currentStock: args.data.currentStock ?? 0,
          expirationDate: args.data.expirationDate ?? null,
        };
        products.push(product);
        return {
          ...product,
          ...(args.include?.category
            ? { category: getCategory(product.categoryId) }
            : {}),
        };
      }),
      update: jest.fn(async (args: any) => {
        const product = products.find(
          (candidate) => candidate.id === args.where.id,
        );
        if (!product) {
          throw new Error(`Product ${args.where.id} not found`);
        }

        Object.assign(product, args.data);
        return {
          ...product,
          ...(args.include?.category
            ? { category: getCategory(product.categoryId) }
            : {}),
        };
      }),
    },
    stockMovement: {
      create: jest.fn(async (args: any) => {
        const movement: StockMovementRecord = {
          id: `movement-${stockMovements.length + 1}`,
          productId: args.data.productId,
          type: args.data.type,
          qtyDelta: args.data.qtyDelta,
          reason: args.data.reason ?? null,
          createdBy: args.data.createdBy,
          createdAt: new Date(),
        };
        stockMovements.push(movement);
        return { ...movement };
      }),
      findMany: jest.fn(async (args?: any) => {
        const results = stockMovements
          .filter((movement) => {
            const product = products.find(
              (candidate) => candidate.id === movement.productId,
            );
            if (!product) {
              return false;
            }

            if (
              args?.where?.product?.shopId &&
              product.shopId !== args.where.product.shopId
            ) {
              return false;
            }

            return true;
          })
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .slice(0, args?.take ?? stockMovements.length)
          .map((movement) => ({
            ...movement,
            ...(args?.include?.product
              ? {
                  product: products.find(
                    (product) => product.id === movement.productId,
                  ),
                }
              : {}),
            ...(args?.include?.user
              ? { user: getUser(movement.createdBy) }
              : {}),
          }));

        return results;
      }),
    },
    alert: {
      findMany: jest.fn(async (args?: any) => {
        return alerts
          .filter((alert) => matchAlert(alert, args?.where))
          .sort((left, right) => {
            const orderBy = args?.orderBy ?? [];
            for (const rule of Array.isArray(orderBy) ? orderBy : [orderBy]) {
              if (!rule) {
                continue;
              }

              if (rule.isRead) {
                if (left.isRead !== right.isRead) {
                  return rule.isRead === 'asc'
                    ? Number(left.isRead) - Number(right.isRead)
                    : Number(right.isRead) - Number(left.isRead);
                }
              }

              if (rule.createdAt) {
                return rule.createdAt === 'asc'
                  ? left.createdAt.getTime() - right.createdAt.getTime()
                  : right.createdAt.getTime() - left.createdAt.getTime();
              }
            }

            return 0;
          })
          .map((alert) => {
            const product = getProduct(alert.productId);
            return {
              ...alert,
              ...(args?.include?.product && product
                ? {
                    product: selectFields(product, args.include.product.select),
                  }
                : {}),
            };
          });
      }),
      findFirst: jest.fn(async (args?: any) => {
        const alert =
          alerts.find((candidate) => matchAlert(candidate, args?.where)) ??
          null;
        if (!alert) {
          return null;
        }

        if (args?.include?.product) {
          const product = getProduct(alert.productId);
          return {
            ...alert,
            ...(product
              ? { product: selectFields(product, args.include.product.select) }
              : {}),
          };
        }

        return args?.select ? selectFields(alert, args.select) : { ...alert };
      }),
      create: jest.fn(async (args: any) => {
        const alert: AlertRecord = {
          id: `alert-${alerts.length + 1}`,
          shopId: args.data.shopId,
          type: args.data.type,
          productId: args.data.productId,
          message: args.data.message,
          isRead: args.data.isRead ?? false,
          createdAt: new Date(),
        };
        alerts.push(alert);
        return { ...alert };
      }),
      update: jest.fn(async (args: any) => {
        const alert = alerts.find(
          (candidate) => candidate.id === args.where.id,
        );
        if (!alert) {
          throw new Error(`Alert ${args.where.id} not found`);
        }

        Object.assign(alert, args.data);
        const product = getProduct(alert.productId);
        return {
          ...alert,
          ...(args.include?.product && product
            ? { product: selectFields(product, args.include.product.select) }
            : {}),
        };
      }),
      deleteMany: jest.fn(async (args?: any) => {
        const before = alerts.length;
        for (let index = alerts.length - 1; index >= 0; index -= 1) {
          if (matchAlert(alerts[index], args?.where)) {
            alerts.splice(index, 1);
          }
        }

        return { count: before - alerts.length };
      }),
    },
    auditLog: {
      create: jest.fn(async (args: any) => {
        const auditLog: AuditLogRecord = {
          id: `audit-${auditLogs.length + 1}`,
          shopId: args.data.shopId,
          userId: args.data.userId,
          action: args.data.action,
          entityType: args.data.entityType,
          entityId: args.data.entityId,
          payload: args.data.payload ?? null,
          createdAt: new Date(),
        };
        auditLogs.push(auditLog);
        return { ...auditLog };
      }),
    },
  };

  prismaMock.$transaction = jest.fn(async (input: any) => {
    if (typeof input === 'function') {
      return input(prismaMock);
    }

    return Promise.all(input);
  });

  prismaMock.__state = {
    alerts,
    stockMovements,
    auditLogs,
  };

  return prismaMock;
}

async function loginAs(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.data.accessToken as string;
}

describe('Phase 1 e2e', () => {
  let app: INestApplication<App>;
  let prismaMock: any;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/moul_hanout?schema=public';
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    prismaMock = await createPrismaMock();

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
        check: jest.fn(
          async (checks: Array<() => Promise<Record<string, unknown>>>) => {
            const results = await Promise.all(checks.map((check) => check()));
            const details = Object.assign({}, ...results);
            return {
              status: 'ok',
              info: details,
              error: {},
              details,
            };
          },
        ),
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
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(),
    );
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns an ok response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('GET /api/v1/health is excluded from global throttling', async () => {
    const responses = await Promise.all(
      Array.from({ length: 12 }, () =>
        request(app.getHttpServer()).get('/api/v1/health'),
      ),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
  });

  it('POST /api/v1/auth/register requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'New Cashier',
        email: 'new.cashier@moulhanout.ma',
        password: 'Cashier@123!',
      })
      .expect(401);
  });

  it('POST /api/v1/auth/register allows an owner to create a cashier', async () => {
    const accessToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${accessToken}`)
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

  it('POST /api/v1/auth/login rejects a user without a shop assignment', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'unassigned@moulhanout.ma',
        password: 'Admin@123!',
      })
      .expect(401);

    expect(response.body.error).toBe('User has no shop assignment');
  });

  it('POST /api/v1/categories denies cashier and allows owner', async () => {
    const cashierToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'Household' })
      .expect(403);

    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Household',
        description: 'Cleaning items',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Household');
    expect(response.body.data.isActive).toBe(true);
  });

  it('GET /api/v1/categories returns only active categories for the shop', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.map((category: any) => category.id)).toEqual([
      'cat-active-1',
      'cat-active-2',
    ]);
  });

  it('PATCH /api/v1/categories/:id denies cashier and allows owner to update a shop category', async () => {
    const cashierToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    await request(app.getHttpServer())
      .patch('/api/v1/categories/cat-active-2')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        name: 'Updated by Cashier',
      })
      .expect(403);

    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .patch('/api/v1/categories/cat-active-2')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Household Essentials',
        description: 'Cleaning and home care items',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: 'cat-active-2',
      name: 'Household Essentials',
      description: 'Cleaning and home care items',
      isActive: true,
    });
  });

  it('PATCH /api/v1/categories/:id returns 404 for a category outside the authenticated shop', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .patch('/api/v1/categories/cat-other-shop')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Should Fail',
      })
      .expect(404);

    expect(response.body.error).toBe('Category not found');
  });

  it('PATCH /api/v1/categories/:id/deactivate blocks deactivation when active products still exist', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .patch('/api/v1/categories/cat-active-1/deactivate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(422);

    expect(response.body.error).toBe(
      'Cannot deactivate a category with active products',
    );
  });

  it('PATCH /api/v1/categories/:id/deactivate soft-deletes a category with no active products', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const deactivateResponse = await request(app.getHttpServer())
      .patch('/api/v1/categories/cat-active-2/deactivate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(deactivateResponse.body.success).toBe(true);
    expect(deactivateResponse.body.data).toMatchObject({
      id: 'cat-active-2',
      isActive: false,
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(listResponse.body.data.map((category: any) => category.id)).toEqual([
      'cat-active-1',
    ]);
  });

  it('POST /api/v1/products rejects costPrice greater than salePrice', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Invalid Product',
        categoryId: 'cat-active-1',
        salePrice: 8,
        costPrice: 10,
      })
      .expect(422);

    expect(response.body.error).toBe(
      'RG08: costPrice cannot be greater than salePrice',
    );
  });

  it('POST /api/v1/products rejects duplicate barcode within the same shop', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Duplicate Barcode Product',
        categoryId: 'cat-active-1',
        salePrice: 12,
        costPrice: 6,
        barcode: 'WATER-001',
      })
      .expect(409);

    expect(response.body.error).toBe(
      'RG07: barcode must be unique within a shop',
    );
  });

  it('PATCH /api/v1/products/:id with isActive false hides the product from GET /products', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    await request(app.getHttpServer())
      .patch('/api/v1/products/product-active')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isActive: false })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  it('GET /api/v1/inventory allows both owner and cashier to see stock', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');
    const cashierToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    const ownerResponse = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const cashierResponse = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(200);

    expect(ownerResponse.body.data).toHaveLength(1);
    expect(ownerResponse.body.data[0]).toMatchObject({
      id: 'product-active',
      currentStock: 10,
      isExpiringSoon: true,
    });
    expect(cashierResponse.body.data).toHaveLength(1);
  });

  it('POST /api/v1/inventory/stock-in denies cashier and increases stock for owner', async () => {
    const cashierToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-in')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        productId: 'product-active',
        quantity: 3,
        reason: 'Unauthorized restock attempt',
      })
      .expect(403);

    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-in')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        productId: 'product-active',
        quantity: 5,
        reason: 'Morning delivery',
        expirationDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.currentStock).toBe(15);
    expect(response.body.data.expirationDate).toBeTruthy();
    expect(prismaMock.__state.stockMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-active',
          type: MovementType.IN,
          qtyDelta: 5,
        }),
      ]),
    );
    expect(prismaMock.__state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'STOCK_IN',
          entityId: 'product-active',
        }),
      ]),
    );
  });

  it('POST /api/v1/inventory/stock-out denies cashier, rejects oversell, and records valid stock-out', async () => {
    const cashierToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-out')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        productId: 'product-active',
        quantity: 2,
        reason: 'Unauthorized removal',
      })
      .expect(403);

    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const invalidResponse = await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-out')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        productId: 'product-active',
        quantity: 99,
        reason: 'Impossible removal',
      })
      .expect(422);

    expect(invalidResponse.body.error).toBe(
      'Cannot remove more stock than is currently available',
    );

    const validResponse = await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-out')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        productId: 'product-active',
        quantity: 4,
        reason: 'Damaged bottles',
      })
      .expect(201);

    expect(validResponse.body.data.currentStock).toBe(6);
    expect(prismaMock.__state.stockMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-active',
          type: MovementType.OUT,
          qtyDelta: -4,
        }),
      ]),
    );
    expect(prismaMock.__state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'STOCK_OUT',
          entityId: 'product-active',
        }),
      ]),
    );
  });

  it('GET /api/v1/inventory/expiring-soon returns only owner-visible products expiring within 5 days', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');
    const cashierToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    await request(app.getHttpServer())
      .get('/api/v1/inventory/expiring-soon')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403);

    const response = await request(app.getHttpServer())
      .get('/api/v1/inventory/expiring-soon')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('product-active');
  });

  it('GET /api/v1/inventory/movements returns recent movement history for owners', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-in')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        productId: 'product-active',
        quantity: 2,
        reason: 'Backroom refill',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-active',
          productName: 'Water 1L',
          type: MovementType.IN,
          quantityDelta: 2,
          createdByName: 'Store Owner',
        }),
      ]),
    );
  });

  it('GET /api/v1/alerts returns synced expiry alerts for the shop', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-active',
          type: AlertType.EXPIRY,
          isRead: false,
        }),
      ]),
    );
    expect(prismaMock.__state.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-active',
          type: AlertType.EXPIRY,
        }),
      ]),
    );
  });

  it('PATCH /api/v1/alerts/:id/read marks an alert as read', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const [alert] = listResponse.body.data;

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/alerts/${alert.id}/read`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(alert.id);
    expect(response.body.data.isRead).toBe(true);
  });

  it('POST /api/v1/inventory/stock-out creates a low-stock alert when the threshold is crossed', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-out')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        productId: 'product-active',
        quantity: 6,
        reason: 'Shelf shrinkage',
      })
      .expect(201);

    expect(prismaMock.__state.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-active',
          type: AlertType.LOW_STOCK,
          isRead: false,
        }),
      ]),
    );
  });

  it('GET /api/v1/users requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('GET /api/v1/users allows an authenticated owner', async () => {
    const accessToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'owner@moulhanout.ma' }),
        expect.objectContaining({ email: 'cashier@moulhanout.ma' }),
      ]),
    );
    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'other.owner@moulhanout.ma' }),
        expect.objectContaining({ email: 'unassigned@moulhanout.ma' }),
      ]),
    );
    expect(response.body.data[0]).toHaveProperty('role');
    expect(response.body.data[0]).not.toHaveProperty('shopRoles');
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

  it('POST /api/v1/auth/login is rate limited after repeated attempts', async () => {
    const responses = await Promise.all(
      Array.from({ length: 12 }, () =>
        request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'missing@moulhanout.ma',
          password: 'wrongpassword',
        }),
      ),
    );

    expect(responses.some((response) => response.status === 429)).toBe(true);
  });

  it('GET /api/v1/users denies an authenticated cashier', async () => {
    const accessToken = await loginAs(
      app,
      'cashier@moulhanout.ma',
      'Cashier@123!',
    );

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('PATCH /api/v1/users/:id/deactivate disables the user and blocks later login', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const deactivateResponse = await request(app.getHttpServer())
      .patch('/api/v1/users/user-cashier/deactivate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(deactivateResponse.body.success).toBe(true);
    expect(deactivateResponse.body.data.isActive).toBe(false);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'cashier@moulhanout.ma',
        password: 'Cashier@123!',
      })
      .expect(401);
  });

  it('PATCH /api/v1/users/:id/deactivate blocks the owner from deactivating their own account', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/user-owner/deactivate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);

    expect(response.body.error).toBe('You cannot deactivate your own account');
  });

  it('PATCH /api/v1/users/:id/activate reactivates an inactive user so they can sign in again', async () => {
    const ownerToken = await loginAs(app, 'owner@moulhanout.ma', 'Admin@123!');

    await request(app.getHttpServer())
      .patch('/api/v1/users/user-cashier/deactivate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const activateResponse = await request(app.getHttpServer())
      .patch('/api/v1/users/user-cashier/activate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(activateResponse.body.success).toBe(true);
    expect(activateResponse.body.data.isActive).toBe(true);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'cashier@moulhanout.ma',
        password: 'Cashier@123!',
      })
      .expect(200);
  });
});
