import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/common/enums';
import { ConfigService } from '@nestjs/config';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockOwner = {
    id: 'owner-id',
    email: 'owner@example.com',
    role: Role.OWNER,
    isActive: true,
  };

  const mockCashier = {
    id: 'cashier-id',
    email: 'cashier@example.com',
    role: Role.CASHIER,
    isActive: true,
  };

  const mockSession = {
    id: 'session-id',
    userId: 'any',
    expiresAt: new Date(Date.now() + 10000),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (where.id === mockOwner.id) return mockOwner;
            if (where.id === mockCashier.id) return mockCashier;
            return null;
          }),
          findMany: jest.fn().mockReturnValue([mockOwner, mockCashier]),
        },
        session: {
          findUnique: jest.fn().mockReturnValue(mockSession),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: string, role: Role) => {
    return jwtService.sign(
      { sub: userId, role, sid: mockSession.id },
      {
        secret: configService.get('jwt.secret'),
        expiresIn: '1h',
      },
    );
  };

  describe('GET /users (Owner Only)', () => {
    it('should allow access for OWNER', () => {
      const token = generateToken(mockOwner.id, Role.OWNER);
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should deny access for CASHIER (403 Forbidden)', () => {
      const token = generateToken(mockCashier.id, Role.CASHIER);
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny access without token (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('GET /users/:id (Owner Only)', () => {
    it('should allow access for OWNER', () => {
      const token = generateToken(mockOwner.id, Role.OWNER);
      return request(app.getHttpServer())
        .get(`/users/${mockOwner.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should deny access for CASHIER (403 Forbidden)', () => {
      const token = generateToken(mockCashier.id, Role.CASHIER);
      return request(app.getHttpServer())
        .get(`/users/${mockOwner.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
