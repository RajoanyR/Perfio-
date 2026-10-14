import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/security/prisma-exception.filter.js';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  // Validation globale des données
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Gestion des erreurs Prisma
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Configuration Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OPQUAL — API')
    .setDescription(
      'Documentation des API de la plateforme OPQUAL KPI',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  // Déclare l'authentification Bearer pour Swagger
  document.security = [{ bearer: [] }];

  SwaggerModule.setup('api', app, document);

  // Démarrage du serveur
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
