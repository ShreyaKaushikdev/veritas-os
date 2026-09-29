import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FIX #2: CORS Restriction - Only allow whitelisted origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [],
  ].flat().filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without origin (like Postman, mobile, Electron)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✅ FIX #3: Rate Limiting - Global rate limiter configured via APP_GUARD in AppModule
  // (60 requests per minute per IP - configured in app.module.ts ThrottlerModule)

  // OpenAPI Swagger Specification Setup
  const config = new DocumentBuilder()
    .setTitle('DOGFOOD OS API')
    .setDescription('Self-hosted, offline-first operating system for fair judged events')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Write openapi.yaml to project root for contract compliance
  try {
    const yaml = require('js-yaml');
    const yamlStr = yaml.dump(document);
    fs.writeFileSync(path.join(__dirname, '../../../openapi.yaml'), yamlStr, 'utf8');
  } catch (e) {
    // Fallback if js-yaml is not present at bootstrap
    fs.writeFileSync(path.join(__dirname, '../../../openapi.json'), JSON.stringify(document, null, 2), 'utf8');
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 DOGFOOD OS API running on http://localhost:${port}`);
  console.log(`📖 Swagger API Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
