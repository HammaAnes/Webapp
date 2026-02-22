const isDev = import.meta.env.DEV;

type LogLevel = "error" | "warn" | "info" | "debug";

type LogData = Record<string, unknown> | Error | string | number | boolean | null | undefined;

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: LogData;
  timestamp: string;
  userAgent?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatMessage(level: LogLevel): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return prefix;
  }

  private addLog(level: LogLevel, message: string, data?: LogData) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  error(message: string, data?: LogData) {
    this.addLog("error", message, data);

    if (isDev) {
      console.error(this.formatMessage("error"), message, data);
    } else {
      console.error(message);
    }
  }

  warn(message: string, data?: LogData) {
    this.addLog("warn", message, data);

    if (isDev) {
      console.warn(this.formatMessage("warn"), message, data);
    }
  }

  info(message: string, data?: LogData) {
    this.addLog("info", message, data);

    if (isDev) {
      console.log(this.formatMessage("info"), message, data);
    }
  }

  debug(message: string, data?: LogData) {
    this.addLog("debug", message, data);

    if (isDev) {
      console.debug(this.formatMessage("debug"), message, data);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
