import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'yaml';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const isProd = process.env.NODE_ENV === 'production';

  // Behind a load balancer / reverse proxy: use the real client IP for rate limiting.
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = isProd
    ? configuredOrigins
    : [...configuredOrigins, 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3001'];
  if (isProd && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must include the deployed admin origin in production');
  }
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Set Global Prefix to /api
  app.setGlobalPrefix('api');

  // Setup Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Setup Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('StayGrid API')
    .setDescription('The core backend API for the StayGrid monorepo.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Write the OpenAPI specification to a YAML file as requested
  const yamlString = yaml.stringify(document);
  if (process.env.GENERATE_OPENAPI_FILE === 'true') {
    fs.writeFileSync('swagger-spec.yaml', yamlString);
  }

  // Public API docs are a reconnaissance gift; only expose them outside production unless explicitly enabled.
  if (!isProd || process.env.SWAGGER_ENABLED === 'true') {
    SwaggerModule.setup('api/docs', app, document);
  }
  app.enableShutdownHooks();

  await app.listen(Number(process.env.PORT) || 3000, '0.0.0.0');
}
void bootstrap();
