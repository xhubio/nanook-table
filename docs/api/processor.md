# Processor API Reference

The processor module contains the main orchestrator (`TestcaseProcessor`), the writer interface, filter implementations, and factory functions for quick setup.

```typescript
import {
  TestcaseProcessor,
  InterfaceWriter,
  FilterProcessorInterface,
  SimpleArrayFilterProcessor,
  SimpleArrayIgnoreFilterProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter,
  createDefaultFileProcessor
} from '@xhubio/nanook-table'
```

---

## TestcaseProcessor

The central orchestrator that ties together table models, data generators, and writers. It iterates over all tables and their executable test cases, runs generators to produce data, and passes the results to writers.

### Constructor

```typescript
new TestcaseProcessor(options: {
  logger?: LoggerInterface
  generatorRegistry: DataGeneratorRegistry
  writer: InterfaceWriter[]
  tables: Record<string, TableInterface>
})
```

| Option | Type | Description |
|---|---|---|
| `logger` | `LoggerInterface` | Optional. Logger instance for diagnostic output. Defaults to a `LoggerMemory` |
| `generatorRegistry` | `DataGeneratorRegistry` | Registry containing all available data generators |
| `writer` | `InterfaceWriter[]` | The writers that receive generated test case data |
| `tables` | `Record<string, TableInterface>` | Required. The table models to process, keyed by table name. `FileProcessor.tables` is an array, so convert it: `Object.fromEntries(fileProcessor.tables.map((t) => [t.tableName, t]))` |

### Properties

| Property | Type | Description |
|---|---|---|
| `tables` | `Record<string, TableInterface>` | The table models to process, keyed by table name. Filled from the `tables` constructor option; `addTables(tables)` adds further tables. Do not assign the `FileProcessor.tables` array to it: every `ref:` would then fail with "The targetTable 'X' does not exists" |

### Methods

#### `async process(): Promise<void>`

Processes all tables and generates test data. This is the main entry point that runs the full generation pipeline.

The processing steps are:

1. Call `loadStore()` on the generator registry (loads all generator stores)
2. Call `before()` on each writer
3. For each table in `tables`:
   a. For each executable test case in the table:
      - Create directives from the test case definition
      - Execute static directives (write literal values)
      - Execute reference directives (resolve cross-table references)
      - Execute generator directives in order:
        - Call `generate()` on the appropriate generator
        - Retry generators that return `undefined` (dependency not yet available)
        - Call `createPostProcessDirectives()` after each generator succeeds
      - Execute all post-process directives (sorted by order)
      - Apply filters
      - Call `write()` on each writer with the completed test case data
4. Call `after()` on each writer
5. Call `saveStore()` on the generator registry (persists all generator stores)

### Example

```typescript
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  DataGeneratorRegistry,
  GeneratorFaker,
  type InterfaceWriter
} from '@xhubio/nanook-table'

const logger = new LoggerMemory()
logger.writeConsole = true

// Set up components
const fileProcessor = createDefaultFileProcessor(logger)
const registry = new DataGeneratorRegistry()
registry.registerGenerator(
  'faker',
  new GeneratorFaker({ generatorRegistry: registry, name: 'faker', logger })
)
const writer: InterfaceWriter = {
  logger,
  async before() {},
  async write(tc) {
    console.log(tc.tableName, tc.name)
  },
  async after() {}
}

// Load and process
await fileProcessor.load('resources/tests.xlsx')
const tables = Object.fromEntries(
  fileProcessor.tables.map((t) => [t.tableName, t])
)

const processor = new TestcaseProcessor({
  logger,
  generatorRegistry: registry,
  writer: [writer],
  tables
})

await processor.process()
```

### Registering Filters

Filters can be registered on the processor to include or exclude test cases based on their tags.

```typescript
const processor = new TestcaseProcessor({ logger, generatorRegistry, writer: [writer], tables })

// Only process test cases tagged with 'smoke'
processor.addFilterProcessor(new SimpleArrayFilterProcessor({ name: 'include', delimiter: ',' }))

// Skip test cases tagged with 'slow'
processor.addFilterProcessor(new SimpleArrayIgnoreFilterProcessor({ name: 'exclude', delimiter: ',' }))
```

---

## InterfaceWriter

Abstract base class for writers. A writer receives fully generated test case data and writes it to some output destination (files, database, console, etc.).

### Constructor

```typescript
new InterfaceWriter({ logger }: { logger: LoggerInterface })
```

### Methods

#### `async before(): Promise<void>`

Called once before the processor starts generating test cases. Use this for initialization (creating output directories, opening database connections, writing file headers, etc.).

#### `async write(testcaseData: TestcaseData): Promise<void>`

Called once for each generated test case. The `testcaseData` object contains all generated field values, metadata, tags, and filter results.

| Parameter | Type | Description |
|---|---|---|
| `testcaseData` | `TestcaseData` | The fully populated test case data object |

#### `async after(): Promise<void>`

Called once after all test cases have been processed. Use this for cleanup (closing files, finalizing output, writing summaries, etc.).

### Custom Writer Example

```typescript
import { InterfaceWriter } from '@xhubio/nanook-table'
import type { TestcaseData } from '@xhubio/nanook-table'

class ConsoleWriter extends InterfaceWriter {
  async before(): Promise<void> {
    console.log('--- Start of test data ---')
  }

  async write(testcaseData: TestcaseData): Promise<void> {
    const name = testcaseData.name
    console.log(`Test case: ${name}`)
    console.log(JSON.stringify(testcaseData.data, null, 2))
  }

  async after(): Promise<void> {
    console.log('--- End of test data ---')
  }
}
```

### Using Multiple Writers

The processor accepts an array of writers. All writers receive every test case.

```typescript
import fs from 'node:fs/promises'
import path from 'node:path'
import { TestcaseProcessor, type InterfaceWriter } from '@xhubio/nanook-table'

const jsonWriter: InterfaceWriter = {
  logger,
  async before() {},
  async write(tc) {
    const dir = path.join('tdg', tc.name)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'testcaseData.json'), JSON.stringify(tc, null, 2))
  },
  async after() {}
}
const consoleWriter = new ConsoleWriter({ logger })

const processor = new TestcaseProcessor({
  logger,
  generatorRegistry: registry,
  writer: [jsonWriter, consoleWriter],
  tables
})
```

---

## FilterProcessorInterface

Abstract interface for filter processors. Filters are used to include or exclude test cases from processing based on their tags and a filter expression.

### Properties

| Property | Type | Description |
|---|---|---|
| `name` | `string` | The name of this filter processor. Matches the filter name used in the spreadsheet's FilterSection |

### Methods

#### `filter(tags: string[], expression: string): boolean`

Evaluates the filter expression against the test case's tags.

| Parameter | Type | Description |
|---|---|---|
| `tags` | `string[]` | All tags defined on the test case |
| `expression` | `string` | The filter expression from the spreadsheet cell |

**Returns:** `true` if the test case passes the filter (should be processed), `false` if it should be skipped.

---

## SimpleArrayFilterProcessor

An include filter. Splits the expression by a delimiter and checks whether any of the resulting values exist in the test case's tags. If a match is found, the test case is processed.

### Constructor

```typescript
new SimpleArrayFilterProcessor(name: string, delimiter: string)
```

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | The filter name, referenced in the spreadsheet |
| `delimiter` | `string` | Character used to split the expression into individual values |

### Example

```typescript
import { SimpleArrayFilterProcessor } from '@xhubio/nanook-table'

const filter = new SimpleArrayFilterProcessor('include', ',')

// Expression "smoke,regression" matches test case with tag "smoke"
filter.filter(['smoke', 'login'], 'smoke,regression')
// Returns: true

// No match
filter.filter(['payment'], 'smoke,regression')
// Returns: false
```

---

## SimpleArrayIgnoreFilterProcessor

An exclude filter. The inverse of `SimpleArrayFilterProcessor`. Splits the expression by a delimiter and checks whether any of the resulting values exist in the test case's tags. If a match is found, the test case is skipped.

### Constructor

```typescript
new SimpleArrayIgnoreFilterProcessor(name: string, delimiter: string)
```

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | The filter name, referenced in the spreadsheet |
| `delimiter` | `string` | Character used to split the expression into individual values |

### Example

```typescript
import { SimpleArrayIgnoreFilterProcessor } from '@xhubio/nanook-table'

const filter = new SimpleArrayIgnoreFilterProcessor('exclude', ',')

// Expression "slow,flaky" matches test case with tag "slow" -> excluded
filter.filter(['slow', 'login'], 'slow,flaky')
// Returns: false (test case is excluded)

// No match -> not excluded
filter.filter(['smoke', 'login'], 'slow,flaky')
// Returns: true (test case is processed)
```

---

## Factory Functions

These convenience functions create pre-configured instances with sensible defaults. Use them for quick setup.

### createDefaultGeneratorRegistry()

Creates an empty `DataGeneratorRegistry`. No generator is registered, not even `GeneratorFaker`: register every generator your tables call yourself.

```typescript
import {
  createDefaultGeneratorRegistry,
  GeneratorFaker
} from '@xhubio/nanook-table'

const registry = createDefaultGeneratorRegistry()

// The registry is empty; register what your tables use
registry.registerGenerator(
  'faker',
  new GeneratorFaker({ generatorRegistry: registry, name: 'faker', logger })
)
registry.registerGenerator(
  'myGenerator',
  new MyGenerator({ generatorRegistry: registry, name: 'myGenerator', logger })
)
```

### createDefaultWriter(logger: LoggerInterface): InterfaceWriter[]

Creates an array containing the default JSON file writer. This writer outputs one JSON file per test case into a `tdg/` directory.

> **Note (3.x):** the default writer's `before()` and `after()` throw `Method not implemented`, and `TestcaseProcessor.process()` calls `before()` on every writer. A processor using `createDefaultWriter()` therefore fails before the first test case. Use your own writer instead; see [Create a Custom Writer](../tutorials/create-writer.md) or the inline writer in the example above.

```typescript
import { createDefaultWriter, LoggerMemory } from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const writers = createDefaultWriter(logger)
```

### createDefaultFileProcessor(logger: LoggerInterface): Promise\<FileProcessor\>

Creates a `FileProcessor` pre-configured with:
- `ImporterXlsx` as the importer
- `ParserDecision` for `<DECISION_TABLE>` sheets
- `ParserMatrix` for `<MATRIX_TABLE>` sheets
- `ParserSpecification` for `<SPECIFICATION>` sheets (the legacy marker
  `<SPECIFICATION_TABLE>` is also registered so existing workbooks keep loading)

```typescript
import { createDefaultFileProcessor, LoggerMemory } from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const fileProcessor = await createDefaultFileProcessor(logger)
await fileProcessor.load('resources/tests.xlsx')
```
