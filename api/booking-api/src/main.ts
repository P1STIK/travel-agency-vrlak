import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const origins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) ?? [];
  if (origins.length) {
    app.enableCors({ origin: origins, credentials: true });
  } else {
    app.enableCors();
  }

  const port = process.env.PORT || 3333;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Booking API is running on http://localhost:${port}`);
}
bootstrap();
