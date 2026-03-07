# Create a Custom Writer

The default writer outputs each test case as a JSON file. In many real-world scenarios, you need data in a different format -- CSV for import into a database, XML for an API, or a custom structure for a test harness. In this tutorial, you will create a CSV writer and use it alongside the default writer.

## The InterfaceWriter Contract

Every writer must implement the `InterfaceWriter` interface, which defines three methods:

```typescript
interface InterfaceWriter {
  logger: LoggerInterface

  /** Called once before the first test case is processed */
  before(): Promise<void>

  /** Called once for each test case with the generated data */
  write(testcaseData: TestcaseDataInterface): Promise<void>

  /** Called once after the last test case has been processed */
  after(): Promise<void>
}
```

The lifecycle is:

1. **`before()`** -- Runs once before any test case is written. Use it for initialization tasks such as creating output directories, writing file headers, or opening database connections.
2. **`write(testcaseData)`** -- Runs once per test case. The `testcaseData` object contains all the generated data for that test case. Each writer extracts the data it needs and writes it in its own format.
3. **`after()`** -- Runs once after all test cases have been written. Use it for cleanup tasks such as closing file handles or writing summary files.

When multiple writers are registered, they execute in order: all writers' `before()` methods are called, then for each test case all writers' `write()` methods are called, and finally all writers' `after()` methods are called.

## The TestcaseDataInterface Structure

Before writing the CSV writer, it helps to understand the data structure that `write()` receives:

```typescript
interface TestcaseDataInterface {
  /** The name of the originating table (e.g., "Sheet1") */
  tableName: string

  /** The test case name (e.g., "TC1") */
  name: string

  /** Nested data: data[tableName][instanceId] = { fieldName: value } */
  data: Record<string, any>

  /** The primary instance ID for this test case */
  instanceId: string

  /** The call tree for debugging */
  callTree: CallTreeInterface

  /** Directives for post-processing */
  postProcessDirectives: GeneratorDirectiveInterface[]
}
```

The `data` property is the key part. It is a nested object:

- First level: table name (since data can come from multiple referenced tables).
- Second level: instance ID (since a test case can have multiple instances).
- Third level: field name to generated value.

For example:

```json
{
  "Sheet1": {
    "a9dad54a-...": {
      "first name": "Alice",
      "last name": "Garcia",
      "email": "Alice.Garcia@example.com"
    }
  }
}
```

## Create the CSV Writer

Create a file `src/CsvWriter.ts`:

```typescript
import fs from 'node:fs/promises'
import path from 'node:path'
import type { LoggerInterface } from 'nanook-table'
import type { InterfaceWriter } from 'nanook-table'

// Define the shape of the testcase data we receive
interface TestcaseData {
  tableName: string
  name: string
  data: Record<string, Record<string, Record<string, string>>>
}

const DELIMITER = ','

export class CsvWriter implements InterfaceWriter {
  logger: LoggerInterface

  constructor(opts: { logger: LoggerInterface }) {
    this.logger = opts.logger
  }

  /**
   * Called before the first test case is written.
   * Nothing to initialize for this simple writer.
   */
  async before(): Promise<void> {
    // No initialization needed
  }

  /**
   * Writes the generated data for one test case as a CSV file.
   */
  async write(testcaseData: TestcaseData): Promise<void> {
    const fileName = await this.createFileName(testcaseData)
    const sheetName = testcaseData.tableName
    const rows: string[] = []

    // Add a header row
    rows.push(
      ['first name', 'last name', 'email'].join(DELIMITER)
    )

    // Iterate over all instances in this test case
    const instances = testcaseData.data[sheetName]
    if (instances) {
      for (const instanceId of Object.keys(instances)) {
        const dat = instances[instanceId]
        const row = [
          dat['first name'] ?? '',
          dat['last name'] ?? '',
          dat['email'] ?? ''
        ]
        rows.push(row.join(DELIMITER))
      }
    }

    await fs.writeFile(fileName, rows.join('\n'))
  }

  /**
   * Called after the last test case is written.
   * Nothing to clean up for this simple writer.
   */
  async after(): Promise<void> {
    // No cleanup needed
  }

  /**
   * Builds the output file path for a given test case.
   * The directory is expected to already exist (the default writer
   * creates it, and writers execute in registration order).
   */
  private async createFileName(
    testcaseData: TestcaseData
  ): Promise<string> {
    const targetDir = path.join('tdg', testcaseData.name)
    await fs.mkdir(targetDir, { recursive: true })
    return path.join(targetDir, 'person.csv')
  }
}
```

### How It Works

The writer does the following for each test case:

1. Determines the output file name (`tdg/TC1/person.csv`).
2. Reads the generated data from `testcaseData.data`, using the table name as the first key.
3. Iterates over all instance IDs within that table's data.
4. For each instance, extracts the "first name", "last name", and "email" fields and formats them as a CSV row.
5. Writes the complete CSV to disk.

## Register Multiple Writers

Update your `src/tdg.ts` to include both the default writer and the CSV writer:

```typescript
import path from 'node:path'
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter
} from 'nanook-table'
import { GeneratorPerson } from './GeneratorPerson.js'
import { CsvWriter } from './CsvWriter.js'

async function main() {
  const logger = new LoggerMemory()
  logger.writeConsole = true

  const fileProcessor = createDefaultFileProcessor(logger)

  const generatorRegistry = createDefaultGeneratorRegistry()

  // Get the default JSON writer (createDefaultWriter returns an array)
  const defaultWriter = createDefaultWriter(logger)[0]

  // Create the CSV writer
  const csvWriter = new CsvWriter({ logger })

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry,
    // Register both writers; they execute in this order
    writer: [defaultWriter, csvWriter],
    tables: {}
  })

  generatorRegistry.registerGenerator(
    'generatorPerson',
    new GeneratorPerson({
      name: 'generatorPerson',
      generatorRegistry,
      logger
    })
  )

  await fileProcessor.load(path.join('resources', 'demo.xlsx'))
  processor.tables = fileProcessor.tables

  await processor.process()
}

main()
  .then(() => console.log('Done'))
  .catch(console.error)
```

Key points:

- **`createDefaultWriter(logger)`** returns an array containing one default writer. Extract it with `[0]`.
- **The `writer` option** accepts an array of writers. They execute in the order they appear: the default writer runs first (creating the directory and writing `testcaseData.json`), then the CSV writer runs second (writing `person.csv` into the same directory).
- You can register as many writers as you need. Each writer independently extracts and formats the data it cares about.

## Run and Inspect the Output

Compile and run:

```bash
npx tsc
node dist/tdg.js
```

Each test case directory now contains two files:

```
tdg/
  TC1/
    testcaseData.json    (from the default writer)
    person.csv           (from the CSV writer)
  TC2/
    testcaseData.json
    person.csv
  TC3/
    testcaseData.json
    person.csv
  TC4/
    testcaseData.json
    person.csv
```

The CSV file for TC1 might look like this:

```csv
first name,last name,email
Alice,Garcia,Alice.Garcia@example.com
```

## Advanced Writer Patterns

### Aggregating Data Across Test Cases

The `before()` and `after()` methods enable writers that accumulate data across all test cases. For example, a writer that produces a single Excel file with all test cases:

```typescript
export class AggregatingWriter implements InterfaceWriter {
  logger: LoggerInterface
  private allRows: string[][] = []

  constructor(opts: { logger: LoggerInterface }) {
    this.logger = opts.logger
  }

  async before(): Promise<void> {
    this.allRows = []
    this.allRows.push(['Test Case', 'First Name', 'Last Name', 'Email'])
  }

  async write(testcaseData: TestcaseData): Promise<void> {
    const sheetName = testcaseData.tableName
    const instances = testcaseData.data[sheetName]
    if (instances) {
      for (const instanceId of Object.keys(instances)) {
        const dat = instances[instanceId]
        this.allRows.push([
          testcaseData.name,
          dat['first name'] ?? '',
          dat['last name'] ?? '',
          dat['email'] ?? ''
        ])
      }
    }
  }

  async after(): Promise<void> {
    const csv = this.allRows.map(r => r.join(',')).join('\n')
    await fs.mkdir('tdg', { recursive: true })
    await fs.writeFile('tdg/all-persons.csv', csv)
  }
}
```

### Per-Test-Case vs. Summary Files

A recommended practice is to generate per-test-case files (so you can re-run individual tests) and optionally a summary file in `after()` that aggregates everything. This gives you flexibility in how you consume the test data.

## Summary

In this tutorial you learned how to:

1. Implement the `InterfaceWriter` interface with `before()`, `write()`, and `after()` methods.
2. Navigate the `TestcaseDataInterface` structure to extract generated field values.
3. Register multiple writers that each produce different output formats.
4. Use the writer lifecycle to aggregate data or perform setup/cleanup.

Next, you will learn how to create filters that control which test cases get processed.
