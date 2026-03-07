import { LogEntry } from './LogEntry.js'
import { LoggerInterface } from './LoggerInterface.js'

export interface LoggerMemoryOptions {
  /** Defines if the memory logger should also write the output to the console */
  writeConsole?: boolean
}

/**
 * Implements a default logger. It will store all the logEntries in Memory.
 * if 'writeConsole' is set  to true, it will also output the logs to the console.
 * This logger is mainly used for debugging and development.
 */
export class LoggerMemory extends LoggerInterface {
  /** Defines if the memory logger should also write the output to the console */
  writeConsole: boolean = false

  entries: Record<string, LogEntry[]> = {
    debug: [],
    info: [],
    warning: [],
    error: [],
    fatal: []
  }

  constructor(opts?: LoggerMemoryOptions) {
    super()

    if (opts !== undefined && opts.writeConsole !== undefined) {
      this.writeConsole = opts.writeConsole
    }

    // initializes the arrays
    this.clear()
  }

  /**
   * Clears all the existing log entries
   */
  clear() {
    this.entries = {
      debug: [],
      info: [],
      warning: [],
      error: [],
      fatal: []
    }
  }

  /**
   * Stores the log in the internal storage and maybe write its to the console
   * @param level - The log level of the current entry
   * @param entry - The log entry
   */

  protected writeLog(level: string, entry: LogEntry): void {
    if (this.entries[level] !== undefined) {
      this.entries[level].push(entry)
    }

    if (this.writeConsole) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry, null, 2))
    }
  }
}

let loggerMemory: LoggerMemory
export function getLoggerMemory(opts?: LoggerMemoryOptions): LoggerMemory {
  if (loggerMemory === undefined) {
    loggerMemory = new LoggerMemory(opts)
  }
  return loggerMemory
}
