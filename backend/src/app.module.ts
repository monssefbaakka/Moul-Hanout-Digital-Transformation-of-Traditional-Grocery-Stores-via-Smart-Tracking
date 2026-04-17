import {
  Module,
  Global,
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';

import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { databaseConfig } from './config/database.config';
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
      load: [appConfig, jwtConfig, databaseConfig],
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
    CategoriesModule,
    ProductsModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useClass: RedisClient,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class AppModule {}
