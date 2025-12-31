import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import { connectRabbitMQ, closeRabbitMQ } from './config/rabbitmq';
import rabbitmqService from './services/rabbitmq.service';
import logRoutes from './routes/log.routes';
import logController from './controllers/log.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

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

    // Connect to RabbitMQ
    console.log('Connecting to RabbitMQ...');
    await connectRabbitMQ();

    // Start RabbitMQ consumer
    console.log('Starting RabbitMQ consumer...');
    await rabbitmqService.startConsumer();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Logging Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Endpoints:`);
      console.log(`  POST   /logs - Download logs from RabbitMQ`);
      console.log(`  GET    /logs/:dateFrom/:dateTo - Get logs by date range`);
      console.log(`  DELETE /logs - Delete all logs`);
    });
  } catch (error) {
    console.error('Failed to start Logging Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await rabbitmqService.stopConsumer();
  await closeRabbitMQ();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await rabbitmqService.stopConsumer();
  await closeRabbitMQ();
  process.exit(0);
});

startServer();
