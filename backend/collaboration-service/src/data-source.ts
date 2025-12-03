import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST') || process.env.DB_HOST || 'localhost',
  port: parseInt(configService.get('DB_PORT') || process.env.DB_PORT || '5432'),
  username: configService.get('DB_USER') || process.env.DB_USER || 'postgres',
  password: configService.get('DB_PASSWORD') || process.env.DB_PASSWORD || 'postgres',
  database: configService.get('DB_NAME') || process.env.DB_NAME || 'collaboration_db',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['database/migrations/*.sql'],
  synchronize: false, // Never use synchronize in production
  logging: false,
  migrationsRun: true, // Automatically run migrations on startup
});
