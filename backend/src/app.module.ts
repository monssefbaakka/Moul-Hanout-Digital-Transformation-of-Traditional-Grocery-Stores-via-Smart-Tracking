import {
  Module,
  Global,
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ReportsModule } from './modules/reports/reports.module';

import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { jwtConfig } from './config/jwt.config';
import { databaseConfig } from './config/database.config';
import { mailConfig } from './config/mail.config';
import { validateEnv } from './config/env.validation';

@Injectable()
export class RedisClient extends Redis implements OnApplicationShutdown {
  constructor(configService: ConfigService) {
    super(configService.get<string>('REDIS_URL') || 'redis://localhost:6379');
  }

  onApplicationShutdown() {
    this.disconnect();
  }
}

@Global()
@Module({
  imports: [
    // Configuration — load env first
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, jwtConfig, databaseConfig, mailConfig],
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Core
    DatabaseModule,

    // Feature modules
    AuthModule,
    AlertsModule,
    CategoriesModule,
    InventoryModule,
    ProductsModule,
    SalesModule,
    UsersModule,
    HealthModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: 'REDIS_CLIENT',
      useClass: RedisClient,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class AppModule {}
