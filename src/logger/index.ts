import * as colors from 'colors';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const logLevelColors = {
  [LogLevel.DEBUG]: colors.gray,
  [LogLevel.INFO]: colors.blue,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
};

export class Logger {
  constructor(
    public readonly module: string,
    private logLevel: LogLevel = LogLevel.INFO,
  ) {}

  private log(level: LogLevel, message: string): void {
    if (level < this.logLevel) {
      return;
    }

    const logFunc = level >= LogLevel.ERROR ? console.error : console.log;
    const lvl = logLevelColors[level](LogLevel[level]);
    const msg = `[${lvl}] ${this.module}: ${message}`;

    logFunc(msg);
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }

  getLogger(module: string): Logger {
    return new Logger(module, this.logLevel);
  }
}

export const rootLogger = new Logger('root', LogLevel.DEBUG);
