# Processor API Reference

The processor module contains the main orchestrator (`TestcaseProcessor`), the writer interface, filter implementations, and factory functions for quick setup.

```typescript
import {
  TestcaseProcessor,
  SimpleArrayFilterProcessor,
  SimpleArrayIgnoreFilterProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter,
  createDefaultFileProcessor
} from '@xhubio/nanook-table'
import type {
  InterfaceWriter,
  FilterProcessorInterface,
  TestcaseDataInterface
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
| `writeStaticData` | `(testcaseData, directives) => void` | Optional. Writes the static cell values into the test case data. Replace it only to change how static values are stored |
| `writeMetaData` | `(testcaseData, directives) => void` | Optional. Writes the MultiRowSection rows (`{ key, comment, other }`) into the test case data |

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
   a. For each test case column with a true Execute value (once per Multiplicity):
      - Build the node tree from the references; a range reference gives one test case per element
      - Skip the test case if a referenced test case has NeverExecute, or if the filters of the
        column reject the tags of its call tree (see `addFilterProcessor()`)
      - Execute static directives (write literal values)
      - Execute reference and generator directives, retrying the ones that cannot be resolved yet:
        - Call `generate()` on the appropriate generator, unless the column's GeneratorSwitchSection
          switches that generator off
        - Retry generators that return `undefined` (dependency not yet available)
        - Call `createPostProcessDirectives()` after each generator returned a value
      - Execute all post-process directives (sorted by order)
      - Call `write()` on each writer with the completed test case data
4. Call `after()` on each writer
5. Call `saveStore()` on the generator registry (persists all generator stores)

Nanook does not throw for a failed generator or an unresolved reference: it logs the error and goes on. Check `logger.entries.error` after `process()`, and compare the number of written test cases with the number of executed columns.

### Example

```typescript
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  createDefaultGeneratorRegistry,
  type InterfaceWriter
} from '@xhubio/nanook-table'

const logger = new LoggerMemory()
logger.writeConsole = true

// Set up components; the default registry already holds 'faker'
const fileProcessor = createDefaultFileProcessor(logger)
const registry = createDefaultGeneratorRegistry(logger)
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

Filters can be registered on the processor to include or exclude test cases based on their tags. A row of the FilterSection names a filter processor; the processor must be registered under that name, or the filter is ignored and an error is logged. Only the filters of the executed column count, not those of referenced test cases; several filters must all pass, and a test case without tags passes.

```typescript
const processor = new TestcaseProcessor({ logger, generatorRegistry, writer: [writer], tables })

// FilterSection rows named 'include': keep a test case if one of its tags is in the expression
processor.addFilterProcessor(new SimpleArrayFilterProcessor({ name: 'include', delimiter: ',' }))

// FilterSection rows named 'exclude': drop a test case if one of its tags is in the expression
processor.addFilterProcessor(new SimpleArrayIgnoreFilterProcessor({ name: 'exclude', delimiter: ',' }))
```

---

## InterfaceWriter

The interface every writer implements (a type, not a class: implement it, do not extend or construct it). A writer receives fully generated test case data and writes it to some output destination (files, database, console, etc.).

```typescript
interface InterfaceWriter {
  logger: LoggerInterface
  before(): Promise<void>
  write(testcaseData: TestcaseDataInterface): Promise<void>
  after(): Promise<void>
}
```

### Methods

#### `async before(): Promise<void>`

Called once before the processor starts generating test cases. Use this for initialization (creating output directories, opening database connections, writing file headers, etc.).

#### `async write(testcaseData: TestcaseDataInterface): Promise<void>`

Called once for each generated test case, with a copy of the test case data:

| Field | Type | Description |
|---|---|---|
| `tableName` | `string` | The table of the executed column |
| `name` | `string` | The test case name; `-1`, `-2`, … for the elements of a range reference, `.1`, `.2`, … with Multiplicity |
| `instanceId` | `string` | The instance of the test case; its own record is `data[tableName][instanceId]` |
| `data` | `Record<string, Record<string, Record<string, any>>>` | The records, keyed by table name and instance ID; referenced records are under their own table |
| `callTree` | `CallTreeInterface` | The tree of referenced test cases, with `instanceId`, `tableName`, `testcaseName`, `neverExecute`, `tags` and `children` |
| `postProcessDirectives` | `GeneratorDirectiveInterface[]` | Empty by the time the writer gets the data |

#### `async after(): Promise<void>`

Called once after all test cases have been processed. Use this for cleanup (closing files, finalizing output, writing summaries, etc.).

### Custom Writer Example

```typescript
import type {
  InterfaceWriter,
  LoggerInterface,
  TestcaseDataInterface
} from '@xhubio/nanook-table'

class ConsoleWriter implements InterfaceWriter {
  logger: LoggerInterface

  constructor(opts: { logger: LoggerInterface }) {
    this.logger = opts.logger
  }

  async before(): Promise<void> {
    console.log('--- Start of test data ---')
  }

  async write(testcaseData: TestcaseDataInterface): Promise<void> {
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
// continues the examples above: logger, registry, tables and ConsoleWriter
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

The interface for filter processors (a type). Filters are used to include or exclude test cases from processing based on their tags and a filter expression.

### Properties

| Property | Type | Description |
|---|---|---|
| `name` | `string` | The name of this filter processor. Matches the processor name in a row of the spreadsheet's FilterSection |

### Methods

#### `filter(tags: string[], expression: string): boolean`

Evaluates the filter expression against the test case's tags.

| Parameter | Type | Description |
|---|---|---|
| `tags` | `string[]` | All tags of the test case's call tree: its own and those of every referenced test case |
| `expression` | `string` | The filter expression from the spreadsheet cell |

**Returns:** `true` if the test case passes the filter (should be processed), `false` if it should be skipped.

---

## SimpleArrayFilterProcessor

An include filter. Splits the expression by a delimiter and checks whether any of the resulting values exist in the test case's tags. If a match is found, the test case is processed.

### Constructor

```typescript
new SimpleArrayFilterProcessor(options?: { name?: string; delimiter?: string })
```

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `'SimpleArrayFilter'` | The filter name, referenced in the spreadsheet |
| `delimiter` | `string` | `';'` | Character used to split the expression into individual values |

### Example

```typescript
import { SimpleArrayFilterProcessor } from '@xhubio/nanook-table'

const filter = new SimpleArrayFilterProcessor({ name: 'include', delimiter: ',' })

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
new SimpleArrayIgnoreFilterProcessor(options?: { name?: string; delimiter?: string })
```

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `'SimpleArrayIgnoreFilter'` | The filter name, referenced in the spreadsheet |
| `delimiter` | `string` | `';'` | Character used to split the expression into individual values |

### Example

```typescript
import { SimpleArrayIgnoreFilterProcessor } from '@xhubio/nanook-table'

const filter = new SimpleArrayIgnoreFilterProcessor({ name: 'exclude', delimiter: ',' })

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

### createDefaultGeneratorRegistry(logger?: LoggerInterface): DataGeneratorRegistry

Creates a `DataGeneratorRegistry` with `GeneratorFaker` registered as `faker`, so cells like `gen::faker:person.firstName` work. Register every other generator your tables call. Without `logger`, the faker generator logs to the shared `getLoggerMemory()` instance.

```typescript
import {
  createDefaultGeneratorRegistry,
  LoggerMemory
} from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const registry = createDefaultGeneratorRegistry(logger)

// 'faker' is there; register what else your tables use
registry.registerGenerator(
  'myGenerator',
  new MyGenerator({ generatorRegistry: registry, name: 'myGenerator', logger })
)
```

Up to 3.2.x the registry was empty and `registerGenerator()` threw for a name already taken. Since 3.3.0 a registration under a taken name replaces the earlier generator, so scripts that register their own `faker` keep working.

### createDefaultWriter(logger: LoggerInterface, dir?: string): InterfaceWriter[]

Creates an array containing the default JSON file writer. It writes one file per test case, `<dir>/<test case name>/testcaseData.json`; `dir` defaults to `tdg`. `before()` creates the directory, `write()` the folder per test case. It does not delete earlier output. The folder is named after the test case only: when two tables have a column of the same name (`1`, `valid`), the second overwrites the first. For more than one table, use a writer of your own that puts the table name into the path.

```typescript
import { createDefaultWriter, LoggerMemory } from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const writers = createDefaultWriter(logger)            // tdg/<test case>/testcaseData.json
const intoFixtures = createDefaultWriter(logger, 'fixtures/login')
```

Up to 3.2.x `before()` and `after()` of this writer threw `Method not implemented`, so a processor using it failed before the first test case; use your own writer there (see [Create a Custom Writer](../tutorials/create-writer.md)).

### createDefaultFileProcessor(logger: LoggerInterface): FileProcessor

Creates a `FileProcessor` pre-configured with:
- `ImporterXlsx` as the importer
- `ParserDecision` for `<DECISION_TABLE>` sheets
- `ParserMatrix` for `<MATRIX_TABLE>` sheets
- `ParserSpecification` for `<SPECIFICATION>` sheets (the legacy marker
  `<SPECIFICATION_TABLE>` is also registered so existing workbooks keep loading)

```typescript
import { createDefaultFileProcessor, LoggerMemory } from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const fileProcessor = createDefaultFileProcessor(logger)
await fileProcessor.load('resources/tests.xlsx')
```
