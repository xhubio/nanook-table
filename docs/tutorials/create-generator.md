# Create a Custom Data Generator

In the previous tutorial, you used static values in the Generator Function column. In this tutorial, you will create a custom data generator that produces person records -- first name, last name, and a unique email address -- and wire it into the processor.

## Update the Spreadsheet

First, update your Excel file to use the new generator. Add two more FieldSubSection fields ("first name" and "last name") alongside the existing "email" field. Replace the static email value with a generator call.

In the Generator Function column, reference the generator like this:

| Field Name   | Section Type    | Equivalence Class | Generator Function          |
| ------------ | --------------- | ----------------- | --------------------------- |
| Primary Data | FieldSection    |                   |                             |
| first name   | FieldSubSection |                   |                             |
|              |                 | valid             | generatorPerson:firstName   |
| last name    | FieldSubSection |                   |                             |
|              |                 | valid             | generatorPerson:lastName    |
| email        | FieldSubSection |                   |                             |
|              |                 | valid             | generatorPerson:email       |

The format for a generator call is:

```
generatorName:config
```

- **generatorName** -- The name under which the generator is registered in the registry.
- **config** -- A parameter string passed to the generator. The generator decides how to interpret it. In this example, it determines which field of the person record to return.

Add a few more test case columns (TC1 through TC4) with `x` markers on the valid rows, so you have multiple test cases to generate data for.

## Create the Generator

Create a new file `src/GeneratorPerson.ts`. The generator extends `DataGeneratorBase` from nanook-table.

```typescript
import {
  DataGeneratorBase,
  DataGeneratorRegistry,
  LoggerMemory
} from 'nanook-table'
import type {
  DataGeneratorGenerateRequest,
  DataGeneratorOptions
} from 'nanook-table'

// Sample data arrays
const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve',
  'Frank', 'Grace', 'Hank', 'Iris', 'Jack'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
]

const DOMAINS = [
  'example.com', 'testmail.org', 'mailbox.net'
]

interface PersonData {
  firstName: string
  lastName: string
  email: string
}

export class GeneratorPerson extends DataGeneratorBase {
  /**
   * Internal generation method that creates a full person record.
   * This is called once per instanceId.
   */
  private doGeneratePerson(): PersonData {
    const firstName =
      FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName =
      LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const domain =
      DOMAINS[Math.floor(Math.random() * DOMAINS.length)]
    const email = this.makeUnique(firstName, lastName, domain)

    return { firstName, lastName, email }
  }

  /**
   * Override generate() to return a specific field from the person record
   * based on the config parameter in the generator directive.
   */
  override async generate(
    request: DataGeneratorGenerateRequest
  ): Promise<string> {
    const { instanceId, generatorDirective } = request
    const param = generatorDirective?.config ?? ''

    // If we already generated data for this instanceId, return the
    // requested field from the cached object.
    if (instanceId && this.instanceData.has(instanceId)) {
      const data = this.instanceData.get(instanceId) as PersonData
      return data[param as keyof PersonData]
    }

    // Generate a new person record.
    const genData = this.doGeneratePerson()

    // Cache it so subsequent calls with the same instanceId
    // return fields from the same person.
    if (instanceId) {
      this.instanceData.set(instanceId, genData)
    }

    return genData[param as keyof PersonData]
  }

  /**
   * Ensures the generated email is unique across all test cases.
   * Uses the built-in uniqueSet from DataGeneratorBase.
   */
  private makeUnique(
    firstName: string,
    lastName: string,
    domain: string
  ): string {
    let email = `${firstName}.${lastName}@${domain}`
    let counter = 1

    while (this.uniqueSet.has(email)) {
      email = `${firstName}.${lastName}-${counter}@${domain}`
      counter++
    }

    this.uniqueSet.add(email)
    return email
  }
}
```

### How It Works

There are several important concepts in this generator:

**The `config` parameter.**
When the spreadsheet contains `generatorPerson:firstName`, Nanook splits this into the generator name (`generatorPerson`) and the config string (`firstName`). The config is available via `request.generatorDirective.config`. The generator uses it to decide which field of the person record to return.

**The `instanceId` concept.**
Each test case has a unique instance ID. When the processor encounters the three generator calls (`generatorPerson:firstName`, `generatorPerson:lastName`, `generatorPerson:email`) for the same test case, all three calls receive the same `instanceId`. The generator uses this to ensure it generates the person data only once and returns consistent fields. Without instance ID caching, the first name, last name, and email could come from different randomly generated persons.

**The `uniqueSet`.**
`DataGeneratorBase` provides a built-in `Set` called `uniqueSet`. The generator uses it to track generated emails and ensure no duplicates. If a collision is detected, a numeric suffix is appended.

**The `instanceData` map.**
`DataGeneratorBase` provides a built-in `Map` called `instanceData` for caching generated data per instance ID. This is the mechanism that makes instance-based caching work.

## Register the Generator

Update your `src/tdg.ts` file to import and register the generator:

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

async function main() {
  const logger = new LoggerMemory()
  logger.writeConsole = true

  const fileProcessor = createDefaultFileProcessor(logger)

  const generatorRegistry = createDefaultGeneratorRegistry()

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry,
    writer: createDefaultWriter(logger),
    tables: {}
  })

  // Register the custom generator
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

The `registerGenerator` call takes two arguments:

1. The name that matches what you wrote in the spreadsheet (`generatorPerson`).
2. An instance of the generator, constructed with a `DataGeneratorOptions` object.

## Run and Inspect the Output

Compile and run:

```bash
npx tsc
node dist/tdg.js
```

In the `tdg/` directory, you should now see four subdirectories (`TC1` through `TC4`), each containing a `testcaseData.json` file. Open one of them:

```json
{
  "tableName": "Sheet1",
  "name": "TC1",
  "data": {
    "Sheet1": {
      "a9dad54a-c12e-46d8-914e-926b32e82424": {
        "first name": "Alice",
        "last name": "Garcia",
        "email": "Alice.Garcia@example.com"
      }
    }
  },
  "instanceId": "a9dad54a-c12e-46d8-914e-926b32e82424",
  "callTree": {
    "instanceId": "364c485f-d863-490c-8600-b419f4504ad1",
    "tableName": "Sheet1",
    "testcaseName": "TC1",
    "children": []
  }
}
```

Key observations:

- The first name, last name, and email are consistent -- the email is built from the same first and last name.
- Every run produces different data because the generator uses `Math.random()`.
- Across all four test cases, every email address is unique.

## The DataGeneratorBase Lifecycle

Understanding the full lifecycle helps when building more advanced generators:

1. **`loadStore()`** -- Called once before processing begins. If `useStore` is enabled, it loads previously persisted data from disk (useful for maintaining uniqueness across runs).
2. **`generate(request)`** -- Called for each generator directive in each test case. Should return the generated value. The base implementation caches by `instanceId` and delegates to `doGenerate()`.
3. **`createPostProcessDirectives(request)`** -- Called after `generate()`. Returns additional directives that need processing in a second pass (e.g., when one generator depends on another generator's output).
4. **`postProcess(request)`** -- Called after all generators have completed their first pass. Used for resolving cross-generator dependencies.
5. **`saveStore()`** -- Called once after all processing is complete. Persists the generator state to disk if `useStore` is enabled.

For most generators, you only need to override `generate()` or `doGenerate()`.

## Summary

In this tutorial you learned how to:

1. Reference a custom generator from the spreadsheet using `generatorName:config` syntax.
2. Extend `DataGeneratorBase` to create a generator that produces structured data.
3. Use `instanceId` to ensure consistent data across multiple generator calls within the same test case.
4. Use `uniqueSet` to guarantee uniqueness across test cases.
5. Register the generator with `generatorRegistry.registerGenerator()`.

Next, you will create a custom writer that exports the generated data as CSV files.
