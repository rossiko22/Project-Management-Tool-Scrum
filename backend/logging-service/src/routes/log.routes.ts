import { Router } from 'express';
import logController from '../controllers/log.controller';

const router = Router();

/**
 * @swagger
 * /logs:
 *   post:
 *     summary: Download logs from RabbitMQ queue
 *     description: Downloads all available logs from the RabbitMQ queue and stores them in the database
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Logs downloaded successfully
 *       500:
 *         description: Server error
 */
router.post('/', logController.downloadLogsFromQueue.bind(logController));

/**
 * @swagger
 * /logs/{dateFrom}/{dateTo}:
 *   get:
 *     summary: Get logs by date range
 *     description: Retrieves logs between the specified date range
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *         description: Start date (YYYY-MM-DD)
 *       - in: path
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successfully retrieved logs
 *       500:
 *         description: Server error
 */
router.get('/:dateFrom/:dateTo', logController.getLogsByDateRange.bind(logController));

/**
 * @swagger
 * /logs:
 *   delete:
 *     summary: Delete all logs
 *     description: Deletes all logs from the database
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: All logs deleted successfully
 *       500:
 *         description: Server error
 */
router.delete('/', logController.deleteAllLogs.bind(logController));

export default router;
