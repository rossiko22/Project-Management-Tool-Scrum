import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5436'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'logging_db',
});

pool.on('connect', () => {
  console.log('Connected to logging database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        log_type VARCHAR(20) NOT NULL,
        url VARCHAR(500),
        correlation_id VARCHAR(100),
        application_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_correlation_id ON logs(correlation_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_application ON logs(application_name);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
