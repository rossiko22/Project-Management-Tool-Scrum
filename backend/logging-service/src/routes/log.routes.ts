import { Router } from 'express';
import logController from '../controllers/log.controller';

const router = Router();

// POST /logs - Download all logs from RabbitMQ and store in database
router.post('/', logController.downloadLogsFromQueue.bind(logController));

// GET /logs/:dateFrom/:dateTo - Get logs between two dates
router.get('/:dateFrom/:dateTo', logController.getLogsByDateRange.bind(logController));

// DELETE /logs - Delete all logs from database
router.delete('/', logController.deleteAllLogs.bind(logController));

export default router;
