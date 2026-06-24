import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from './infrastructure/database/database.provider';
import { seedDatabase } from './infrastructure/database/seeder';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend requests
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Run database migrations & seeder if DB is empty
  const db = app.get<NestDrizzleDatabase>(DRIZZLE_PROVIDER);
  try {
    console.log('Checking database migrations...');
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
    console.log('Database migrations verified/applied.');
    await seedDatabase(db);
  } catch (error) {
    console.error('Failed to run database migrations/seeder:', error);
  }

  const port = process.env.PORT || 43000;
  await app.listen(port);
  console.log(`Smile Saviours API listening on port ${port}...`);
}
bootstrap();
