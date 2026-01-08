import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { initDatabase } from './config/database';
import { connectRabbitMQ, closeRabbitMQ } from './config/rabbitmq';
import logRoutes from './routes/log.routes';
import logController from './controllers/log.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Logging Service API',
      version: '1.0.0',
      description: 'API documentation for the Logging Service - handles centralized logging via RabbitMQ',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', logController.getHealth.bind(logController));

// Log routes
app.use('/logs', logRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

async function startServer() {
  try {
    console.log('Starting Logging Service...');

    // Initialize database
    console.log('Initializing database...');
    await initDatabase();

    // Connect to RabbitMQ (but don't start auto-consumer)
    console.log('Connecting to RabbitMQ...');
    await connectRabbitMQ();
    console.log('RabbitMQ connected - logs will be stored in queue until manually downloaded');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Logging Service running on port ${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`\nEndpoints:`);
      console.log(`  POST   /logs - Download all logs from RabbitMQ queue and store in database`);
      console.log(`  GET    /logs/{dateFrom}/{dateTo} - Get logs by date range from database`);
      console.log(`  DELETE /logs - Delete all logs from database`);
      console.log(`\nRabbitMQ is acting as a log repository. Logs accumulate in the queue until POST /logs is called.`);
    });
  } catch (error) {
    console.error('Failed to start Logging Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeRabbitMQ();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeRabbitMQ();
  process.exit(0);
});

startServer();
