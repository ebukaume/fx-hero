import { Lookup } from "./type";

type Level = "INFO" | "WARN" | "DEBUG" | "ERROR";

export class Logger {
  private static client: Console;
  private static instance: Logger | undefined;

  constructor() {
    if (Logger.instance !== undefined) {
      return Logger.instance;
    }

    Logger.client = console;
    Logger.instance = this;
  }

  info(message: string, meta?: Lookup): void {
    this.log("INFO", message, meta);
  }

  debug(message: string, meta?: Lookup): void {
    this.log("DEBUG", message, meta);
  }

  warn(message: string, meta?: Lookup): void {
    this.log("WARN", message, meta);
  }

  error(message: string, meta?: Lookup): void {
    this.log("ERROR", message, meta);
  }

  private log(level: Level, message: string, meta?: Lookup): void {
    const time = new Date().toISOString();
    const data = `${message} ${JSON.stringify({ meta })}`;

    Logger.client.log(`[${level}] [${time}] ${data}`);
  }
}

export const logger = new Logger();
