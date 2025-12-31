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

    return {
      timestamp: new Date(message.timestamp),
      log_type: message.logType as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
      url: message.url,
      correlation_id: message.correlationId,
      application_name: message.applicationName,
      message: message.message,
    };
  } catch (error) {
    console.error('Error parsing log message:', error);
    return null;
  }
}

export function formatLogForDisplay(log: Log): string {
  const timestamp = log.timestamp.toISOString().replace('T', ' ').substring(0, 23);
  const correlationPart = log.correlation_id ? ` Correlation: ${log.correlation_id}` : '';
  const urlPart = log.url ? ` ${log.url}` : '';

  return `${timestamp} ${log.log_type}${urlPart}${correlationPart} [${log.application_name}] - ${log.message}`;
}
