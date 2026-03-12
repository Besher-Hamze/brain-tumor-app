import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── CORS ──────────────────────────────────────────
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── GLOBAL VALIDATION ─────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,        // auto-transform types
    }),
  );

  // ── STATIC FILES ──
// Images are stored and served by the AI (Flask) module
// NestJS only saves the URL path returned from Flask

  // ── GLOBAL PREFIX ─────────────────────────────────
  app.setGlobalPrefix('api');

  // ── START ─────────────────────────────────────────
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Backend running at: http://localhost:${port}/api`);
  console.log(`📁 Uploads served at:  http://localhost:${port}/uploads\n`);
}

bootstrap();
