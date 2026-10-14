import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/security/prisma-exception.filter.js';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 3000,'0.0.0.0');
}

bootstrap();
