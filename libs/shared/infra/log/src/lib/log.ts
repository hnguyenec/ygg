export enum LogLevel {
  Unknown = 0,
  Fatal,
  Error,
  Warning,
  Info,
  Debug,
  Trace
}

export function getLogLevelName(level: LogLevel): string {
  return LogLevel[level];
}

export class Log {
  createAt: Date;
  level: LogLevel;
  message: string;

  constructor(message: any, level: LogLevel = LogLevel.Info) {
    this.createAt = new Date();
    this.level = level;
    if (typeof message === 'string') {
      this.message = message;
    } else {
      this.message = JSON.stringify(message);
    }
  }
}

export class LogFilter {
  threshold: LogLevel;

  constructor(threshold: LogLevel) {
    this.threshold = threshold;
  }

  pass(log: Log): boolean {
    return log.level <= this.threshold;
  }
}

export interface LogConfig {
  threshold: LogLevel;
}


