/**
 * 🚀 Bootstrap MS Express API
 * ──────────────────────────
 * - Crée l'app NestJS
 * - Configure CORS
 * - Ajoute la validation globale
 * - Configure Swagger
 * - Démarre sur le port configuré
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';


async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = process.env.PORT || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api';
  const corsOrigin = configService.get<string>('cors.origin') || '*';

  // ─── CORS ───────────────────────────────────
  // ─── CORS ───────────────────────────────────
app.enableCors({
  origin: [
    'https://ms-express-admin-delta.vercel.app', 
    'https://ms-express-admin-b1pjv3w4f-abdoul-latif.vercel.app',            
    'http://localhost:5173',                     
    'http://localhost:5174',                     
    'http://localhost:8081',                    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // ─── Préfixe global /api ────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ─── Validation globale ─────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Retire les propriétés non déclarées
      forbidNonWhitelisted: true, // Erreur si propriétés inconnues
      transform: true,            // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  
  // ─── Swagger ────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MS Express API')
    .setDescription(
      'API REST pour l\'application de livraison MS Express 🛵\n\n' +
      '**Modules** : Auth, Users, Orders, Chats, Ratings',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entre ton access token JWT',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentification & inscription')
    .addTag('Users', 'Gestion des utilisateurs')
    .addTag('Orders', 'Commandes et livraisons')
    .addTag('Chats', 'Messagerie client-livreur')
    .addTag('Ratings', 'Avis et notations')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    customSiteTitle: 'MS Express API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // ─── Démarrage ──────────────────────────────
  await app.listen(port, '0.0.0.0');  // ← écoute sur toutes les interfaces

  logger.log('════════════════════════════════════════════════');
  logger.log(`🚀 MS Express API démarrée !`);
  logger.log(`📍 URL        : http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Swagger    : http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🌍 Environnement : ${configService.get('nodeEnv')}`);
  logger.log('════════════════════════════════════════════════');
}

bootstrap().catch((error) => {
  console.error('❌ Erreur au démarrage de l\'API:', error);
  process.exit(1);
});