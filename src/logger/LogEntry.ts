export type LogMessageType = string | object

/**
 * The format of the internal log entry
 */
export type LogEntry = {
  /** The log level as string */
  level: string

  /** The message for the log entry */
  message: LogMessageType

  /** The time the log is written */
  time: string
}
