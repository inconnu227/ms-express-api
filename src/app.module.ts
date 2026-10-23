/**
 * ⚙️ Module racine MS Express
 * ──────────────────────────
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import configuration from './config/configuration';
import { getJwtConfig } from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ChatsModule } from './modules/chats/chats.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // ─── Configuration ────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    // ─── Base de données ──────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get('nodeEnv') === 'production';

        // PRODUCTION (Render) : PostgreSQL
        if (isProd && process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          } as any;
        }

        // DÉVELOPPEMENT (Local) : SQLite
        return {
          type: 'sqlite',
          database: './data/ms-express.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        } as any;
      },
    }),

    // ─── JWT ──────────────────────────────────
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getJwtConfig(configService),
    }),

    // ─── Modules métier ───────────────────────
    UsersModule,
    AuthModule,
    OrdersModule,
    ChatsModule,
    RatingsModule,
    CommissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}