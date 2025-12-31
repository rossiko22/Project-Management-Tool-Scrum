import { Request, Response } from 'express';
import logService from '../services/log.service';
import rabbitmqService from '../services/rabbitmq.service';

export class LogController {
  async downloadLogsFromQueue(_req: Request, res: Response): Promise<void> {
    try {
      console.log('POST /logs - Downloading logs from RabbitMQ...');

      // Consume all logs from RabbitMQ queue
      const logs = await rabbitmqService.consumeAllLogs();

      if (logs.length === 0) {
        res.status(200).json({
          message: 'No logs found in RabbitMQ queue',
          count: 0,
        });
        return;
      }

      // Save logs to database
      const savedCount = await logService.saveLogs(logs);

      res.status(200).json({
        message: 'Logs downloaded and stored successfully',
        count: savedCount,
      });
    } catch (error) {
      console.error('Error downloading logs:', error);
      res.status(500).json({
        error: 'Failed to download logs from RabbitMQ',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLogsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo } = req.params;

      console.log(`GET /logs/${dateFrom}/${dateTo} - Retrieving logs...`);

      // Parse dates (expecting format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss',
        });
        return;
      }

      if (fromDate > toDate) {
        res.status(400).json({
          error: 'dateFrom must be before dateTo',
        });
        return;
      }

      const logs = await logService.getLogsByDateRange(fromDate, toDate);

      res.status(200).json({
        dateFrom: fromDate.toISOString(),
        dateTo: toDate.toISOString(),
        count: logs.length,
        logs,
      });
    } catch (error) {
      console.error('Error retrieving logs:', error);
      res.status(500).json({
        error: 'Failed to retrieve logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteAllLogs(_req: Request, res: Response): Promise<void> {
    try {
      console.log('DELETE /logs - Deleting all logs...');

      const deletedCount = await logService.deleteAllLogs();

      res.status(200).json({
        message: 'All logs deleted successfully',
        count: deletedCount,
      });
    } catch (error) {
      console.error('Error deleting logs:', error);
      res.status(500).json({
        error: 'Failed to delete logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const logCount = await logService.getLogCount();
      const rabbitmqActive = rabbitmqService.isActive();

      res.status(200).json({
        status: 'healthy',
        service: 'logging-service',
        database: 'connected',
        rabbitmq: rabbitmqActive ? 'consuming' : 'connected',
        logCount,
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new LogController();
