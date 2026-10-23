/**
 * 🗄️ Configuration TypeORM
 * Supporte SQLite (dev) et PostgreSQL (prod).
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const getDatabaseConfig = (
  configService?: ConfigService,
): DataSourceOptions => {
  const get = (key: string): string | undefined =>
    configService?.get<string>(key) || process.env[key];

  const dbType = (get('DB_TYPE') || 'sqlite') as 'sqlite' | 'postgres';
  const synchronize = get('DB_SYNCHRONIZE') !== 'false'; // true par défaut en dev
  const logging = get('DB_LOGGING') === 'true';

  // ─── SQLite (dev simple) ─────────────────────
  if (dbType === 'sqlite') {
    return {
      type: 'sqlite',
      database: get('DB_DATABASE') || './data/ms-express.sqlite',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize,
      logging,
    };
  }

  // ─── PostgreSQL (prod / Docker) ──────────────
  return {
    type: 'postgres',
    host: get('DB_HOST') || 'localhost',
    port: parseInt(get('DB_PORT') || '5432', 10),
    username: get('DB_USERNAME') || 'ms_express',
    password: get('DB_PASSWORD') || 'ms_express_dev_password',
    database: get('DB_DATABASE') || 'ms_express',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize,
    logging,
  };
};

// Instance DataSource pour les migrations CLI
export const AppDataSource = new DataSource(getDatabaseConfig());