import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '../src/common/enums';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: any; // Using any to avoid TS errors with the mock

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    role: Role.CASHIER,
    isActive: true,
    createdAt: new Date(),
  };

  const mockSession = {
    id: 'session-id',
    userId: mockUser.id,
    token: 'hashed-refresh-token',
    expiresAt: new Date(Date.now() + 100000),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (where.email === mockUser.email || where.id === mockUser.id) return mockUser;
            return null;
          }),
          create: jest.fn().mockReturnValue(mockUser),
        },
        session: {
          create: jest.fn().mockReturnValue(mockSession),
          update: jest.fn().mockReturnValue(mockSession),
          findUnique: jest.fn().mockReturnValue({ ...mockSession, user: mockUser }),
          deleteMany: jest.fn().mockReturnValue({ count: 1 }),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return tokens for valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 204 when logged out successfully', async () => {
      const jwtService = app.get(JwtService);
      const configService = app.get(ConfigService);
      const validToken = jwtService.sign(
        { sub: mockUser.id, role: mockUser.role, sid: mockSession.id },
        { secret: configService.get('jwt.secret'), expiresIn: '1h' }
      );

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(204);

      expect(prismaService.session.deleteMany).toHaveBeenCalled();
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });
});
