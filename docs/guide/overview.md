# Architecture Overview

## What is Nanook?

Nanook is a toolkit for test case and test data creation from spreadsheets. You define your test cases in Excel/XLSX tables, and Nanook reads those spreadsheets, processes the test case definitions, generates test data through configurable data generators, and writes the output in whatever format your tests require.

This approach gives you two key advantages:

1. **Traceability** -- Your spreadsheets serve as a living specification of test cases and test coverage, readable by anyone on the team.
2. **Reproducibility** -- Changing the specification and re-running Nanook regenerates all affected test data automatically, eliminating the tedious manual work of keeping test data in sync with evolving requirements.

Nanook is distributed as a single npm package: `nanook-table`.

## Data Flow

The following diagram shows how data flows through Nanook, from an Excel file to the final test output:

```
Excel/XLSX File
    |
    v
ImporterXlsx                   Reads raw cell data from .xlsx files
    |
    v
FileProcessor                  Routes each sheet to the correct parser
    |                          based on the table type identifier in cell A1
    |
    +---> ParserDecision       Parses <DECISION_TABLE> sheets
    +---> ParserMatrix         Parses <MATRIX_TABLE> sheets
    +---> ParserSpecification  Parses <SPECIFICATION> sheets
    |                          (converts to decision table via RuleConverterPlugins)
    |
    v
Table Models                   In-memory representations of the parsed tables
    |                          (TableDecision, TableMatrix)
    |
    v
TestcaseProcessor              Orchestrates the entire generation pipeline:
    |                          resolves references, expands multiplicities,
    |                          applies filters, and coordinates generators
    |
    +---> DataGeneratorRegistry    Registry of named data generators
    |         |
    |         +---> DataGeneratorBase subclasses (e.g. GeneratorFaker)
    |
    +---> Writers (InterfaceWriter[])
    |
    v
Output files                   Test data in the format(s) your tests need
```

## Components

### ImporterXlsx

The `ImporterXlsx` class reads `.xlsx` files and provides a uniform cell-access interface. It implements `ImporterInterface`, so you can substitute it with a custom importer for other spreadsheet formats if needed.

Importers are registered with the `FileProcessor` by file extension:

```typescript
import { FileProcessor, ImporterXlsx } from 'nanook-table'

const fileProcessor = new FileProcessor()
const importer = new ImporterXlsx()

fileProcessor.registerImporter('xlsx', importer)
fileProcessor.registerImporter('xls', importer)
```

### FileProcessor

The `FileProcessor` is the entry point for loading spreadsheet files. It:

1. Determines which importer to use based on the file extension.
2. Reads every sheet in the workbook.
3. Inspects cell A1 of each sheet to find the table type identifier (`<DECISION_TABLE>`, `<MATRIX_TABLE>`, or `<SPECIFICATION>`).
4. Delegates parsing to the appropriate parser registered for that table type.
5. Collects all resulting table models.

```typescript
import {
  FileProcessor,
  ImporterXlsx,
  ParserDecision,
  ParserMatrix,
  ParserSpecification
} from 'nanook-table'

const fileProcessor = new FileProcessor()
fileProcessor.registerImporter('xlsx', new ImporterXlsx())
fileProcessor.registerParser('<DECISION_TABLE>', new ParserDecision())
fileProcessor.registerParser('<MATRIX_TABLE>', new ParserMatrix())
fileProcessor.registerParser('<SPECIFICATION>', new ParserSpecification())

await fileProcessor.load('my-tests.xlsx')

const tables = fileProcessor.tables // TableInterface[]
```

Sheets whose A1 cell does not match any registered parser are silently ignored, allowing you to include documentation sheets or scratch space in the same workbook.

### Parsers

Each parser converts raw spreadsheet data into a table model:

- **ParserDecision** -- Parses decision tables (equivalence class tables) into `TableDecision` models. Registered under the key `<DECISION_TABLE>`.
- **ParserMatrix** -- Parses matrix tables into `TableMatrix` models. Registered under the key `<MATRIX_TABLE>`.
- **ParserSpecification** -- Parses specification tables and converts them into `TableDecision` models using the `RuleConverterPlugin` system. Registered under the key `<SPECIFICATION>`.

### Table Models

Nanook uses two table model types:

- **TableDecision** -- Represents a decision table (also called an equivalence class table). Contains sections (field definitions, tags, filters, etc.) and test case columns. Each test case is a `TestcaseDefinitionDecision`.
- **TableMatrix** -- Represents a matrix table for state transitions or predecessor-successor relationships. Each cell in the matrix becomes a `TestcaseDefinitionMatrix` identified by its row and column position.

Both implement the `TableInterface`, which provides a uniform API for the processor to iterate over test cases and extract directives.

### TestcaseProcessor

The `TestcaseProcessor` is the core orchestrator. It takes the parsed table models and drives the entire generation pipeline:

1. Iterates over all tables and their test cases.
2. Calls `createDirectives()` on each test case definition to collect generator, reference, static, and field directives.
3. Resolves references (which may point to test cases in other tables).
4. Handles range references by creating multiple instances of the calling test case.
5. Applies multiplicity (creating N copies of a test case).
6. Invokes data generators through the `DataGeneratorRegistry`.
7. Applies filters to include or exclude test cases.
8. Passes the generated test case data to all registered writers.

```typescript
import { TestcaseProcessor, DataGeneratorRegistry } from 'nanook-table'

const processor = new TestcaseProcessor({
  tables: {},
  generatorRegistry: registry,
  writer: [myWriter]
})

processor.addTables(fileProcessor.tables)
await processor.process()
```

### DataGeneratorRegistry

The `DataGeneratorRegistry` is a centralized service registry that manages all data generators by their unique names. Generators are registered by name, and this name is the same name used in the spreadsheet to invoke the generator via generator directives.

```typescript
import { DataGeneratorRegistry, GeneratorFaker } from 'nanook-table'

const registry = new DataGeneratorRegistry()
registry.registerGenerator('faker', new GeneratorFaker())
```

Each generator has a lifecycle: `loadStore() -> generate() -> createPostProcessDirectives() -> postProcess() -> saveStore()`. The registry coordinates calling `loadStore()` and `saveStore()` across all registered generators.

### Writers

Writers implement the `InterfaceWriter` interface and are responsible for converting the generated test case data into the output format needed by your tests (JSON files, CSV, database inserts, API calls, etc.). Multiple writers can be registered, and each one is called for every generated test case in the order they were added.

### Filters

Filters allow you to selectively process test cases. You define filter criteria in the spreadsheet using `FilterSection` and `TagSection`, and register filter processors with the `TestcaseProcessor`:

- **Tags** are labels attached to test cases (e.g., `priority:high`, `smoke`). Tags propagate through reference chains.
- **Filters** are conditions evaluated per test case to decide whether it should be included in the output.

Nanook provides built-in filter processors such as `SimpleArrayFilterProcessor` and `SimpleArrayIgnoreFilterProcessor`.

## Putting It All Together

All components work together in a pipeline orchestrated by the `TestcaseProcessor`. A minimal setup looks like this:

```typescript
import {
  FileProcessor,
  ImporterXlsx,
  ParserDecision,
  ParserMatrix,
  ParserSpecification,
  TestcaseProcessor,
  DataGeneratorRegistry,
  GeneratorFaker
} from 'nanook-table'

// 1. Set up the file processor with importer and parsers
const fileProcessor = new FileProcessor()
fileProcessor.registerImporter('xlsx', new ImporterXlsx())
fileProcessor.registerParser('<DECISION_TABLE>', new ParserDecision())
fileProcessor.registerParser('<MATRIX_TABLE>', new ParserMatrix())
fileProcessor.registerParser('<SPECIFICATION>', new ParserSpecification())

// 2. Load spreadsheet files
await fileProcessor.load(['tests.xlsx', 'more-tests.xlsx'])

// 3. Set up the data generator registry
const registry = new DataGeneratorRegistry()
registry.registerGenerator('faker', new GeneratorFaker())

// 4. Set up the processor with generators and writers
const processor = new TestcaseProcessor({
  tables: {},
  generatorRegistry: registry,
  writer: [myWriter]
})

// 5. Add tables and run
processor.addTables(fileProcessor.tables)
await processor.process()
```
