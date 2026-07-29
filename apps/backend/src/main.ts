import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps) or specific allowed origins
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.match(/^http:\/\/(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\.\d{1,3}\.\d{1,3}:\d+$/)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
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
  fs.writeFileSync('swagger-spec.yaml', yamlString);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000, '0.0.0.0');
}
void bootstrap();
