# Logger API Reference

The logger module provides a logging interface used by all Nanook components and an in-memory implementation suitable for development, testing, and production use.

```typescript
import {
  LoggerInterface,
  LoggerMemory,
  getLoggerMemory
} from 'nanook-table'
```

---

## LoggerInterface

Abstract base class that defines the logging contract. All Nanook components accept a `LoggerInterface` and use it for diagnostic output. You can implement this interface to integrate with any logging framework (Winston, Pino, console, etc.).

### Log Levels

Log levels are ordered by severity. Setting the logger to a given level means it will only output messages at that level or higher.

| Level | Numeric Value | Description |
|---|---|---|
| `debug` | `0` | Detailed diagnostic information |
| `info` | `1` | General informational messages |
| `warning` | `2` | Potentially problematic situations |
| `error` | `3` | Error conditions that allow continued operation |
| `fatal` | `4` | Severe errors that may cause the process to abort |

### Properties

| Property | Type | Description |
|---|---|---|
| `level` | `string \| number` | The current log level. Messages below this level are suppressed. Can be set as a string (`'debug'`, `'info'`, etc.) or a number (`0`--`4`) |

### Methods

#### `clear(): void`

Clears all stored log entries. The specific behavior depends on the implementation.

#### `getLevelNumber(level: string): number`

Converts a log level string to its numeric value.

```typescript
logger.getLevelNumber('warning') // 2
logger.getLevelNumber('debug')   // 0
```

#### `getTime(): string`

Returns the current time formatted for log entries. The format is implementation-specific.

#### `async debug(message: string | object): Promise<void>`

Logs a message at the `debug` level (numeric value `0`).

```typescript
await logger.debug('Processing table: LoginTests')
await logger.debug({ table: 'LoginTests', testcases: 5 })
```

#### `async info(message: string | object): Promise<void>`

Logs a message at the `info` level (numeric value `1`).

```typescript
await logger.info('File loaded successfully')
```

#### `async warning(message: string | object): Promise<void>`

Logs a message at the `warning` level (numeric value `2`).

```typescript
await logger.warning('Sheet "OldFormat" uses deprecated section type')
```

#### `async error(message: string | object): Promise<void>`

Logs a message at the `error` level (numeric value `3`).

```typescript
await logger.error('Generator "myGen" failed after 100 uniqueness retries')
```

#### `async fatal(message: string | object): Promise<void>`

Logs a message at the `fatal` level (numeric value `4`).

```typescript
await logger.fatal('Cannot open file: tests.xlsx')
```

### Implementing a Custom Logger

To integrate Nanook with your own logging infrastructure, extend `LoggerInterface` and override the `_writeLog` method:

```typescript
import { LoggerInterface } from 'nanook-table'

class WinstonLogger extends LoggerInterface {
  private winston: WinstonInstance

  constructor(winston: WinstonInstance) {
    super()
    this.winston = winston
  }

  _writeLog(level: string, entry: string | object): void {
    const message = typeof entry === 'string' ? entry : JSON.stringify(entry)
    this.winston.log(level, message)
  }

  clear(): void {
    // Winston does not support clearing logs
  }
}
```

---

## LoggerMemory

In-memory logger that stores all log entries in arrays, organized by level. Optionally also writes to the console. This is the default logger used in examples and tests.

### Extends

`LoggerInterface`

### Constructor

```typescript
new LoggerMemory()
```

### Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `writeConsole` | `boolean` | `false` | When `true`, log entries are also printed to `console`. Set this to `true` during development to see output |
| `entries` | `LogEntries` | `{ debug: [], info: [], warning: [], error: [], fatal: [] }` | All stored log entries, organized by level. Each entry contains the timestamp and message |

### Methods

#### `clear(): void`

Empties all log entry arrays.

```typescript
const logger = new LoggerMemory()
await logger.info('hello')
console.log(logger.entries.info.length) // 1

logger.clear()
console.log(logger.entries.info.length) // 0
```

### Example

```typescript
import { LoggerMemory } from 'nanook-table'

const logger = new LoggerMemory()
logger.writeConsole = true

await logger.info('Starting generation')
await logger.debug('Processing sheet: LoginTests')
await logger.warning('Empty test case column found')

// Access stored entries
for (const entry of logger.entries.warning) {
  console.log(`Warning at ${entry.time}: ${entry.message}`)
}

// Check for errors after processing
if (logger.entries.error.length > 0) {
  console.log(`${logger.entries.error.length} errors occurred`)
}
```

### Log Entry Structure

Each entry in the `entries` arrays is an object with:

| Field | Type | Description |
|---|---|---|
| `time` | `string` | Formatted timestamp of when the entry was logged |
| `message` | `string \| object` | The logged message or data object |

---

## getLoggerMemory()

Factory function that creates and returns a new `LoggerMemory` instance.

```typescript
import { getLoggerMemory } from 'nanook-table'

const logger = getLoggerMemory()
logger.writeConsole = true
await logger.info('Ready')
```

This is a convenience shorthand for `new LoggerMemory()`.

---

## Usage Patterns

### Development -- console output enabled

```typescript
const logger = new LoggerMemory()
logger.writeConsole = true
logger.level = 'debug'
```

### Testing -- capture and assert on log entries

```typescript
import { describe, it, expect } from 'vitest'
import { LoggerMemory } from 'nanook-table'

describe('my generator', () => {
  it('logs a warning for empty config', async () => {
    const logger = new LoggerMemory()
    const gen = new MyGenerator({ logger })

    await gen.generate('id1', testcase, directive)

    expect(logger.entries.warning.length).toBe(1)
    expect(logger.entries.warning[0].message).toContain('empty config')
  })
})
```

### Production -- suppress low-level output

```typescript
const logger = new LoggerMemory()
logger.level = 'warning' // only warning, error, and fatal are logged
```
