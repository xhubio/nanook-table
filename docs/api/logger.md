# Logger API Reference

The logger module provides a logging interface used by all Nanook components and an in-memory implementation suitable for development, testing, and production use.

```typescript
import {
  LoggerInterface,
  LoggerMemory,
  getLoggerMemory
} from '@xhubio/nanook-table'
import type { LogEntry, LogMessageType } from '@xhubio/nanook-table'
```

---

## LoggerInterface

The base class that defines the logging contract (a concrete class, not an interface, despite the name). All Nanook components accept a `LoggerInterface` and use it for diagnostic output. Extend it to integrate with any logging framework (Winston, Pino, console, etc.). On its own it discards every message.

### Log Levels

Log levels are ordered by severity. Setting the logger to a given level means it will only output messages at that level or higher. **The default level is `error`**: `debug`, `info` and `warning` messages are dropped unless you lower it.

| Level | Numeric Value | Description |
|---|---|---|
| `debug` | `0` | Detailed diagnostic information |
| `info` | `1` | General informational messages |
| `warning` | `2` | Potentially problematic situations |
| `error` | `3` | Error conditions that allow continued operation (the default level) |
| `fatal` | `4` | Severe errors that may cause the process to abort |

### Properties

| Property | Type | Description |
|---|---|---|
| `level` | set: `string \| number`, get: `string` | The current log level. Messages below this level are suppressed. Set it as a string (`'debug'`, `'info'`, etc.) or a number (`0`--`4`); reading it returns the name. Default `'error'` |

### Methods

#### `debug(message: string | object): void`

Logs a message at the `debug` level (numeric value `0`).

```typescript
logger.debug('Processing table: LoginTests')
logger.debug({ table: 'LoginTests', testcases: 5 })
```

#### `info(message: string | object): void`

Logs a message at the `info` level (numeric value `1`).

```typescript
logger.info('File loaded successfully')
```

#### `warning(message: string | object): void`

Logs a message at the `warning` level (numeric value `2`).

```typescript
logger.warning('Sheet "OldFormat" uses deprecated section type')
```

#### `error(message: string | object): void`

Logs a message at the `error` level (numeric value `3`).

```typescript
logger.error('Generator "myGen" returned no value')
```

#### `fatal(message: string | object): void`

Logs a message at the `fatal` level (numeric value `4`).

```typescript
logger.fatal('Cannot open file: tests.xlsx')
```

The log methods are synchronous. The helpers `getLevelNumber()`, `getLevelName()`, `getLogEntry()` and `getTime()` are `protected`: available to subclasses, not to callers.

### Implementing a Custom Logger

To integrate Nanook with your own logging infrastructure, extend `LoggerInterface` and override the protected `writeLog()` method. It is called only for messages at or above `level`, with an entry `{ level, time, message }`:

```typescript
import { LoggerInterface } from '@xhubio/nanook-table'
import type { LogEntry } from '@xhubio/nanook-table'

interface WinstonLike {
  log(level: string, message: string): void
}

class WinstonLogger extends LoggerInterface {
  private winston: WinstonLike

  constructor(winston: WinstonLike) {
    super()
    this.winston = winston
  }

  protected override writeLog(level: string, entry: LogEntry): void {
    const message =
      typeof entry.message === 'string' ? entry.message : JSON.stringify(entry.message)
    this.winston.log(level, message)
  }
}
```

---

## LoggerMemory

In-memory logger that stores log entries in arrays, organized by level. Optionally also writes to the console. This is the default logger used in examples and tests. Like every `LoggerInterface`, it stores only messages at or above `level`, which defaults to `error`.

### Extends

`LoggerInterface`

### Constructor

```typescript
new LoggerMemory(options?: { writeConsole?: boolean })
```

### Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `writeConsole` | `boolean` | `false` | When `true`, log entries are also printed to `console`. Set this to `true` during development to see output |
| `entries` | `Record<string, LogEntry[]>` | `{ debug: [], info: [], warning: [], error: [], fatal: [] }` | The stored log entries, organized by level |

### Methods

#### `clear(): void`

Empties all log entry arrays.

```typescript
const logger = new LoggerMemory()
logger.level = 'info'
logger.info('hello')
console.log(logger.entries.info.length) // 1

logger.clear()
console.log(logger.entries.info.length) // 0
```

### Example

```typescript
import { LoggerMemory } from '@xhubio/nanook-table'

const logger = new LoggerMemory({ writeConsole: true })
logger.level = 'warning' // keep warnings too; the default keeps only error and fatal

logger.info('Starting generation')          // dropped: below 'warning'
logger.warning('Empty test case column found')

// Access stored entries
for (const entry of logger.entries.warning) {
  console.log(`Warning at ${entry.time}: ${JSON.stringify(entry.message)}`)
}

// Check for errors after processing
if (logger.entries.error.length > 0) {
  console.log(`${logger.entries.error.length} errors occurred`)
}
```

### Log Entry Structure

Each entry in the `entries` arrays is a `LogEntry`:

| Field | Type | Description |
|---|---|---|
| `level` | `string` | The level the entry was logged at |
| `time` | `string` | Formatted timestamp of when the entry was logged |
| `message` | `string \| object` | The logged message or data object |

---

## getLoggerMemory(options?: { writeConsole?: boolean }): LoggerMemory

Returns a shared `LoggerMemory` instance: the first call creates it, every later call returns the same object (and ignores `options`). Nanook uses it where no logger is passed, for example in `new FileProcessor()` and `createDefaultGeneratorRegistry()`. For a logger of your own, use `new LoggerMemory()`.

```typescript
import { getLoggerMemory } from '@xhubio/nanook-table'

const logger = getLoggerMemory()
logger.writeConsole = true
logger.level = 'info'
logger.info('Ready')
```

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
import { DataGeneratorRegistry, LoggerMemory } from '@xhubio/nanook-table'
import type { GeneratorDirectiveInterface } from '@xhubio/nanook-table'
import { MyGenerator } from '../src/MyGenerator.js' // your generator

describe('my generator', () => {
  it('logs an error for an unknown config', async () => {
    const logger = new LoggerMemory()
    const generatorRegistry = new DataGeneratorRegistry()
    const gen = new MyGenerator({ generatorRegistry, name: 'my', logger })

    // DataGeneratorBase logs a rejected doGenerate() and returns undefined
    const value = await gen.generate({
      instanceId: 'id1',
      generatorDirective: { config: 'unknown' } as GeneratorDirectiveInterface
    })

    expect(value).toBeUndefined()
    expect(logger.entries.error.length).toBe(1)
  })
})
```

### Production -- suppress low-level output

```typescript
const logger = new LoggerMemory()
logger.level = 'warning' // only warning, error, and fatal are logged
```
