import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS properly for credentials
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3000',
      'http://127.0.0.1:3001',
    ],
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

  await app.listen(3000);
}
void bootstrap();
