import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));

  const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
  if (origins.length) app.enableCors({ origin: origins, credentials: true });

  await app.listen(process.env.PORT || 3333);
}
bootstrap();
