import { LogEntry, LogMessageType } from './LogEntry.js'

/**
 * A map to convert the log level name to a number
 */
const LOG_LEVEL_NAME_TO_NUM: Record<string, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4
}

/**
 * An Array to convert a log level number to a log level name
 */
const LOG_LEVEL_NUM_TO_NAME: string[] = Array.from(
  Object.keys(LOG_LEVEL_NAME_TO_NUM)
)

/** Defines the default log level */
const DEFAULT_LEVEL: number = 3
const MAX_LEVEL: number = LOG_LEVEL_NUM_TO_NAME.length - 1

/**
 * Defines the interface of a logger used by all the modules.
 */
export class LoggerInterface {
  /** The log level number */
  _level: number = DEFAULT_LEVEL // eslint-disable-line  @typescript-eslint/naming-convention

  /**
   * sets a new log level
   * @param level -  The logLevel as number or String value
   */
  public set level(level: number | string) {
    if (typeof level === 'number') {
      if (level <= MAX_LEVEL) {
        this._level = level
      } else {
        this._level = MAX_LEVEL
      }
    } else {
      this._level = this.getLevelNumber(level)
    }
  }

  /**
   * Returns the current log level
   *
   * @returns level - The logLevel as string
   */
  public get level(): string {
    return LOG_LEVEL_NUM_TO_NAME[this._level]
  }

  /**
   * returns the logLevel as a number
   * @param level - The loglevel as a string
   * @returns The loglevel as a number
   */
  protected getLevelNumber(level: string): number {
    if (LOG_LEVEL_NAME_TO_NUM[level] !== undefined) {
      return LOG_LEVEL_NAME_TO_NUM[level]
    }
    return DEFAULT_LEVEL
  }

  /**
   * Returns the logLevel as a string
   * @param level - The loglevel as a number
   * @returns The loglevel as a string
   */
  protected getLevelName(level: number): string {
    if (LOG_LEVEL_NUM_TO_NAME[level] !== undefined) {
      return LOG_LEVEL_NUM_TO_NAME[level]
    }

    return LOG_LEVEL_NUM_TO_NAME[DEFAULT_LEVEL]
  }

  /**
   * Do the logging
   * @param level - The log level of the current entry
   * @param message - The data to log
   */
  protected log(level: string, message: LogMessageType): void {
    if (this.getLevelNumber(level) < this._level) {
      return
    }
    this.writeLog(level, this.getLogEntry(level, message))
  }

  /**
   * This function converts a log message into a log entry
   * @param level - The log level of the current entry
   * @param message - The data to log
   * @returns The log entry
   */
  protected getLogEntry(level: string, message: LogMessageType): LogEntry {
    const time = this.getTime()
    let entryMessage: LogMessageType

    if (typeof message === 'string') {
      entryMessage = message
    } else {
      entryMessage = Object.assign({}, message)
    }

    const entry: LogEntry = {
      level,
      time,
      message: entryMessage
    }

    return entry
  }

  /**
   * Writes the log, or do what ever. At this point in time
   * the logs with the wrong level are already filtered
   * @param level - The log level of the current entry
   * @param entry - The log entry
   */
  protected writeLog(
    level: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    entry: LogEntry // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    // do nothing here
  }

  /**
   * Logs the given message with the level 'debug'
   * @param message - The message or data to log
   */
  public debug(message: LogMessageType): void {
    this.log('debug', message)
  }

  /**
   * Logs the given message with the level 'info'
   * @param message - The message or data to log
   */
  public info(message: LogMessageType): void {
    this.log('info', message)
  }

  /**
   * Logs the given message with the level 'warning'
   * @param message - The message or data to log
   */
  public warning(message: LogMessageType): void {
    this.log('warning', message)
  }

  /**
   * Logs the given message with the level 'error'
   * @param message - The message or data to log
   */
  public error(message: LogMessageType): void {
    this.log('error', message)
  }

  /**
   * Logs the given message with the level 'fatal'
   * @param message - The message or data to log
   */
  public fatal(message: LogMessageType): void {
    this.log('fatal', message)
  }

  /**
   * Returns a time string for the log entry
   * @returns The current time in the format used by this logger
   */
  protected getTime(): string {
    function fill(val: number) {
      if (val < 10) {
        return `0${val}`
      }
      return val
    }

    const date = new Date(Date.now())
    const dateStr = `${date.getFullYear()}-${fill(date.getMonth() + 1)}-${fill(
      date.getDate()
    )}`
    const timeStr = `${fill(date.getHours())}:${fill(date.getMinutes())}:${fill(
      date.getSeconds()
    )}`
    return `${dateStr} ${timeStr}`
  }
}
