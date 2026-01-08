export interface Log {
  id?: number;
  timestamp: Date;
  log_type: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  url?: string;
  correlation_id?: string;
  application_name: string;
  message: string;
  created_at?: Date;
}

export interface LogMessage {
  timestamp: string;
  logType: string;
  url?: string;
  correlationId?: string;
  applicationName: string;
  message: string;
}

export function parseLogMessage(messageStr: string): Log | null {
  try {
    const message: LogMessage = JSON.parse(messageStr);

    console.log('Parsed message object:', JSON.stringify(message, null, 2));

    // Parse timestamp - handle various formats
    let timestamp: Date;
    if (typeof message.timestamp === 'string') {
      timestamp = new Date(message.timestamp);
    } else if (typeof message.timestamp === 'number') {
      timestamp = new Date(message.timestamp);
    } else {
      console.warn('No timestamp in message, using current time');
      timestamp = new Date();
    }

    // Validate timestamp
    if (isNaN(timestamp.getTime())) {
      console.error('Invalid timestamp in log message:', message.timestamp);
      console.error('Full message:', messageStr);
      return null;
    }

    const log: Log = {
      timestamp,
      log_type: message.logType as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
      url: message.url,
      correlation_id: message.correlationId,
      application_name: message.applicationName,
      message: message.message,
    };

    console.log('Created log object:', JSON.stringify(log, null, 2));

    return log;
  } catch (error) {
    console.error('Error parsing log message:', error);
    console.error('Message content:', messageStr);
    return null;
  }
}

export function formatLogForDisplay(log: Log): string {
  const timestamp = log.timestamp.toISOString().replace('T', ' ').substring(0, 23);
  const correlationPart = log.correlation_id ? ` Correlation: ${log.correlation_id}` : '';
  const urlPart = log.url ? ` ${log.url}` : '';

  return `${timestamp} ${log.log_type}${urlPart}${correlationPart} [${log.application_name}] - ${log.message}`;
}
