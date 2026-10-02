# Set Up Data Generation

In the previous tutorial, you created a decision table with 39 test cases. That table documented which combinations to test, but you still had to create the test data manually. In this tutorial, you will transform that table into a format that Nanook can parse and use to generate test data automatically.

## Transform the Table for Nanook

A decision table that Nanook can process follows a specific layout. The key change from the free-form equivalence class table is adding a **Generator Function** column and marking the sheet with an identifier.

### Set the Sheet Identifier

The parser only processes sheets that have the correct identifier in cell **A1**. Enter the following value in the first cell of your sheet:

```
<DECISION_TABLE>
```

### Set the Column Headers

Enter the following headers in the second row:

| Column | Header             |
| ------ | ------------------ |
| A      | Field Name         |
| B      | (section type)     |
| C      | Equivalence class  |
| D      | Generator Function |
| E      | Comment            |

The first five columns are fixed and must appear in this order. Test case columns start from column F onward.

### Add the Generator Function Column

The "Generator Function" column (D) is where you specify how data is generated for each equivalence class. For now, enter static values directly:

| Equivalence Class | Generator Function |
| ----------------- | ------------------ |
| valid email       | foo.bar@gum.com    |

Any value you type here that is not a generator call will be treated as static data and used as-is.

### Create Sections

A Nanook decision table is organized into sections:

- **FieldSection** -- Groups one or more fields together. Enter the section name in column A and `FieldSection` in column B.
- **FieldSubSection** -- Each individual field within a FieldSection. Enter the field name in column A and `FieldSubSection` in column B.
- Under each FieldSubSection, add rows for equivalence classes (column C) and their generator values (column D).

### Mark Test Cases

In the first row, starting from column F, enter the test case names (e.g., `TC1`, `TC2`, `TC3`, ...). For each equivalence class row, place an `x` or `e` in the test case columns, just as you did in the previous tutorial.

### Mark the End of the Table

Add a final row with `<END>` in column A. Everything below this row is ignored by the parser.

### Example Layout

Here is a minimal example with a single field and one test case:

| A            | B               | C     | D               | E | F   |
| ------------ | --------------- | ----- | --------------- | - | --- |
| `<DECISION_TABLE>` |            |       |                 |   | TC1 |
| Field Name   |                 | Equivalence class | Generator Function | Comment | |
| Primary Data | FieldSection    |       |                 |   |     |
| email        | FieldSubSection |       |                 |   |     |
|              |                 | valid | foo.bar@gum.com |   | x   |
| `<END>`      |                 |       |                 |   |     |

## Create a TypeScript Project

Now create a project that loads the spreadsheet and generates data.

### Initialize the Project

```bash
mkdir demo-tdg
cd demo-tdg
mkdir resources
mkdir tdg
mkdir src

npm init -y
npm install @xhubio/nanook-table
npm install -D typescript @types/node
```

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src"]
}
```

Make sure your `package.json` includes `"type": "module"`.

### Copy the Spreadsheet

Save the Excel file you created as `demo.xlsx` and place it in the `resources/` directory.

### Write the Processor Script

Create a file `src/tdg.ts` with the following content:

```typescript
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  createDefaultGeneratorRegistry,
  type InterfaceWriter
} from '@xhubio/nanook-table'

async function main() {
  // 1. Create a logger
  const logger = new LoggerMemory()
  logger.writeConsole = true

  // 2. Create a file processor that can load .xlsx files
  const fileProcessor = createDefaultFileProcessor(logger)

  // 3. Load the spreadsheet
  await fileProcessor.load(path.join('resources', 'demo.xlsx'))

  // 4. Key the loaded tables by table name
  const tables = Object.fromEntries(
    fileProcessor.tables.map((t) => [t.tableName, t])
  )

  // 5. Create a writer: one JSON file per test case
  const writer: InterfaceWriter = {
    logger,
    async before() {},
    async write(tc) {
      const dir = path.join('tdg', tc.name)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(
        path.join(dir, 'testcaseData.json'),
        JSON.stringify(tc, null, 2)
      )
    },
    async after() {}
  }

  // 6. Create the test case processor
  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry: createDefaultGeneratorRegistry(),
    writer: [writer],
    tables
  })

  // 7. Process all tables and generate data
  await processor.process()
}

main()
  .then(() => console.log('Done'))
  .catch(console.error)
```

Let's walk through what each part does:

1. **LoggerMemory** stores all log entries in memory. Setting `writeConsole = true` also prints them to the terminal so you can follow what happens.
2. **createDefaultFileProcessor** creates a pre-configured file processor that knows how to read `.xlsx` files and parse `<DECISION_TABLE>`, `<MATRIX_TABLE>`, and `<SPECIFICATION_TABLE>` sheets.
3. **fileProcessor.load()** reads the Excel file, identifies sheets by their identifier, and parses them into table model objects. You can call `load()` multiple times to load multiple spreadsheets. Table names must be unique across all loaded files.
4. **tables** -- `fileProcessor.tables` is an array, but the processor expects an object keyed by table name. Without this step every reference (`ref:`) to another table fails with "The targetTable 'X' does not exists".
5. **writer** -- a writer receives every generated test case. This one writes `tdg/<test case>/testcaseData.json`. [Create a Custom Writer](create-writer.md) shows how to build writers as classes. (`createDefaultWriter()` is not usable in 3.x: its `before()` throws `Method not implemented`.)
6. **TestcaseProcessor** is the core engine. It needs a generator registry (where data generators are registered; `createDefaultGeneratorRegistry()` returns an empty one, which is enough for static values), one or more writers (that output the generated data), the tables, and a logger.
7. **processor.process()** iterates over every table and every test case, runs the generators, and passes the results to the writers.

### Run the Script

Compile and run:

```bash
npx tsc
node dist/tdg.js
```

Or, if you prefer ts-node or tsx:

```bash
npx tsx src/tdg.ts
```

## Understand the Generated Output

After running the script, you should find a file at `tdg/TC1/testcaseData.json`. This file was produced by the writer in `src/tdg.ts`.

```json
{
  "tableName": "Sheet1",
  "name": "TC1",
  "data": {
    "Sheet1": {
      "ab0dc423-2338-44eb-a230-bbab1040c8ff": {
        "email": "foo.bar@gum.com"
      }
    }
  },
  "instanceId": "ab0dc423-2338-44eb-a230-bbab1040c8ff",
  "callTree": {
    "instanceId": "3dd74281-c117-4c51-b8f5-f1262116124a",
    "tableName": "Sheet1",
    "testcaseName": "TC1",
    "children": []
  }
}
```

Here is what each property means:

- **tableName** -- The name of the spreadsheet sheet that produced this test case. By default, this is the Excel sheet name (e.g., "Sheet1").
- **name** -- The test case name as written in the header row of the spreadsheet (e.g., "TC1").
- **data** -- The generated data, organized by table name and then by instance ID. Each instance ID maps to a data object containing the field values.
- **instanceId** -- The primary instance ID for this test case. Instance IDs are UUIDs that change on every run, but the data structure remains the same.
- **callTree** -- A debugging aid that shows the order in which tables were processed. When tables reference other tables, the call tree shows the full chain. For a simple single-table setup, the `children` array is empty.

Since the example uses static data (`foo.bar@gum.com`), the output is the same every time you run it. Only the instance IDs change between runs. In the next tutorial, you will replace static values with a data generator that produces different data on each run.

## Summary

In this tutorial you learned how to:

1. Format a decision table so Nanook can parse it (identifier in A1, fixed column layout, `<END>` marker).
2. Set up a TypeScript project with `@xhubio/nanook-table`.
3. Use `createDefaultFileProcessor`, `TestcaseProcessor`, `createDefaultGeneratorRegistry`, and a small inline writer to load a spreadsheet and generate data.
4. Interpret the output JSON produced by the writer.

Next, you will create a custom data generator that produces person records with unique email addresses.
