import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import configuration from './config/configuration';
import { getDatabaseConfig } from './config/typeorm.config';
import { getJwtConfig } from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { ChatsModule } from './modules/chats/chats.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

     // ... (tes autres imports)




    // ✅ CONFIGURATION POUR RENDER / POSTGRES
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get('nodeEnv') === 'production';
        
        // En production sur Render, on utilise DATABASE_URL
        if (isProd && process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // ⚠️ À mettre à false plus tard et utiliser des migrations
            ssl: {
              rejectUnauthorized: false, // Obligatoire pour Render
            },
          };
        }

        // En local (dev), on garde SQLite
        return {
          type: 'sqlite',
          database: './data/ms-express.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),
    // ... (le reste de tes modules)
  ],
})
export class AppModule {}

    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getJwtConfig(configService),
    }),

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