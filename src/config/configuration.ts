/**
 * ⚙️ Configuration centralisée avec validation
 * ──────────────────────────────────────────
 * - Charge les variables d'env
 * - Valide les secrets en production
 * - Empêche le démarrage si secrets faibles
 */

export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  // ─── Secrets ────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET || 'change_me_dev_secret';
  const jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET || 'change_me_dev_refresh';
  const sessionSecret =
    process.env.SESSION_SECRET || 'change_me_dev_session';

  // ⚠️ En production, refuser les secrets faibles
  if (isProd) {
    const weakSecrets = [
      'change_me',
      'secret',
      'password',
      'dev_secret',
    ];

    if (
      !jwtSecret ||
      weakSecrets.some((w) => jwtSecret.toLowerCase().includes(w)) ||
      jwtSecret.length < 32
    ) {
      throw new Error(
        '❌ JWT_SECRET faible ou par défaut. Utilise node generate-secrets.js',
      );
    }

    if (
      !jwtRefreshSecret ||
      weakSecrets.some((w) =>
        jwtRefreshSecret.toLowerCase().includes(w),
      ) ||
      jwtRefreshSecret.length < 32
    ) {
      throw new Error(
        '❌ JWT_REFRESH_SECRET faible ou par défaut. Utilise node generate-secrets.js',
      );
    }

    if (
      !sessionSecret ||
      weakSecrets.some((w) => sessionSecret.toLowerCase().includes(w)) ||
      sessionSecret.length < 32
    ) {
      throw new Error(
        '❌ SESSION_SECRET faible ou par défaut. Utilise node generate-secrets.js',
      );
    }

    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
      console.warn(
        '⚠️ CORS_ORIGIN="*" en production — devrait être précis',
      );
    }
  }

  return {
    // ─── App ──────────────────────────────────
    nodeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',

    // ─── Base de données ──────────────────────
    database: {
      type: (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres',
      database: process.env.DB_DATABASE || './data/ms-express.sqlite',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    },

    // ─── JWT ──────────────────────────────────
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshSecret: jwtRefreshSecret,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    // ─── Session ──────────────────────────────
    session: {
      secret: sessionSecret,
    },

    // ─── Chiffrement ──────────────────────────
    encryption: {
      key:
        process.env.DATABASE_ENCRYPTION_KEY ||
        'change_me_dev_encryption',
    },

    // ─── CORS ─────────────────────────────────
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
    },

    // ─── Rate limiting ────────────────────────
    rateLimit: {
      window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  };
};