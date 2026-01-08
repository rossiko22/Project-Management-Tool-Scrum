import pool from '../config/database';
import { Log } from '../models/Log';

export class LogService {
  async saveLogs(logs: Log[]): Promise<number> {
    const client = await pool.connect();
    try {
      let savedCount = 0;

      for (const log of logs) {
        await client.query(
          `INSERT INTO logs (timestamp, log_type, url, correlation_id, application_name, message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [log.timestamp, log.log_type, log.url, log.correlation_id, log.application_name, log.message]
        );
        savedCount++;
      }

      console.log(`Saved ${savedCount} logs to database`);
      return savedCount;
    } catch (error) {
      console.error('Error saving logs to database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getLogsByDateRange(dateFrom: Date, dateTo: Date): Promise<Log[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM logs
         WHERE timestamp >= $1 AND timestamp <= $2
         ORDER BY timestamp ASC`,
        [dateFrom, dateTo]
      );

      console.log(`Retrieved ${result.rows.length} logs from ${dateFrom} to ${dateTo}`);
      return result.rows;
    } catch (error) {
      console.error('Error retrieving logs:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAllLogs(): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM logs');
      const deletedCount = result.rowCount || 0;
      console.log(`Deleted ${deletedCount} logs from database`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting logs:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getLogCount(): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM logs');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting log count:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new LogService();
