# Nanook Documentation

Nanook is a toolkit for defining test cases in Excel spreadsheets and generating test data. You describe your test scenarios using equivalence class tables, matrix tables, or specification tables in standard XLSX files, and Nanook reads those definitions, processes them through pluggable data generators, and writes the resulting test data to your chosen output format.

## Key Features

- **Equivalence class tables** -- Define fields, their equivalence classes (valid and invalid), and mark which class applies to each test case. Nanook generates one data set per test case.
- **Matrix tables** -- Describe pairwise or combinatorial relationships between two dimensions of test parameters.
- **Specification tables** -- Define field rules and severities at a higher level; Nanook automatically converts them into equivalence class tables.
- **Pluggable data generators** -- Use the built-in Faker generator or write your own. Generators support instance IDs (same ID yields same data), uniqueness constraints, persistent stores, and post-processing.
- **Custom writers** -- Control how generated data is written: JSON files, databases, or any format you need.
- **Filtering** -- Include or exclude test cases at processing time using tag-based filter expressions.
- **Single package** -- Everything ships as one package (`nanook-table`) with TypeScript types and ESM imports.

## Quick Start

Install the package:

```bash
npm install nanook-table
```

Create and run a generation script:

```typescript
import path from 'node:path'
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter
} from 'nanook-table'

async function main() {
  const logger = new LoggerMemory()
  logger.writeConsole = true

  const fileProcessor = await createDefaultFileProcessor(logger)
  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry: createDefaultGeneratorRegistry(),
    writer: createDefaultWriter(logger)
  })

  await fileProcessor.load(path.join('resources', 'tests.xlsx'))
  processor.tables = fileProcessor.tables
  await processor.process()
}

main()
```

This loads an Excel file, parses every sheet it contains (decision tables, matrix tables, and specification tables), runs the configured data generators for each test case, and writes the output.

## Data Flow

```
Excel / XLSX File
    |
    v
ImporterXlsx              -- reads raw cell values
    |
    v
FileProcessor             -- delegates to the right parser per sheet
    |
    +-- ParserDecision     -- sheets starting with <DECISION_TABLE>
    +-- ParserMatrix       -- sheets starting with <MATRIX_TABLE>
    +-- ParserSpecification + ParserSpecificationConverter
    |                         -- sheets starting with <SPECIFICATION_TABLE>
    v
Table Models              -- TableDecision, TableMatrix
    |
    v
TestcaseProcessor         -- orchestrates the generation loop
    |
    +-- DataGeneratorRegistry
    |       +-- GeneratorFaker (built-in)
    |       +-- your custom generators
    |
    +-- InterfaceWriter[]
    |       +-- default JSON writer
    |       +-- your custom writers
    v
Output Files / Data
```

## Documentation Structure

### API Reference (`api/`)

Detailed reference for every public class, interface, and function:

- [Model](api/model.md) -- Table and test case interfaces, directive types, metadata
- [Data Generator](api/data-generator.md) -- Generator interface, base class, registry, Faker generator
- [File Processor](api/file-processor.md) -- Importers, parsers, specification converter, rule converter plugins
- [Processor](api/processor.md) -- TestcaseProcessor, writers, filters, factory functions
- [Logger](api/logger.md) -- Logger interface and in-memory implementation

### Guides (`guide/`)

Conceptual explanations of how Nanook works:

- Equivalence class tables -- structure, sections, and how test cases map to data
- Matrix tables -- when and how to use them
- Generator commands -- the `gen:` and `ref:` prefixes in spreadsheet cells
- Instance IDs -- how repeated generator calls produce consistent data
- Specification tables -- high-level rule definitions and automatic conversion

### Tutorials (`tutorials/`)

Step-by-step walkthroughs:

- Creating your first equivalence class table
- Writing a custom data generator
- Writing a custom writer
- Creating a filter processor
- Converting an existing generator to the Nanook interface

## Concepts

### Tables

A **table** is a single sheet in an Excel workbook. The first cell of the sheet contains a type marker:

| Marker | Table Type | Description |
|---|---|---|
| `<DECISION_TABLE>` | Decision / Equivalence Class | Fields with equivalence classes, one column per test case |
| `<MATRIX_TABLE>` | Matrix | Two-dimensional parameter combinations |
| `<SPECIFICATION_TABLE>` | Specification | High-level rules that convert to a decision table |

### Directives

When a test case is processed, it produces **directives** -- instructions that tell the processor what data to generate. There are four types:

| Directive | Description |
|---|---|
| `StaticDirective` | A literal value written directly to the output |
| `GeneratorDirective` | A call to a named data generator with configuration |
| `ReferenceDirective` | A reference to data from another table/test case |
| `FieldDirective` | A field selection marker |

### Generators

A **data generator** produces values for test case fields. Generators are registered by name in a `DataGeneratorRegistry`. The processor looks up each generator by name when executing `GeneratorDirective` entries. Generators support:

- **Instance IDs** -- calling the same generator with the same instance ID returns the same data
- **Uniqueness** -- optionally enforce that every generated value is unique
- **Stores** -- persist generated data between runs
- **Post-processing** -- additional generation passes after all primary generation is complete

### Writers

A **writer** receives fully generated test case data and writes it to an output destination. The `before()` method is called once before processing, `write()` is called for each test case, and `after()` is called once when processing is complete.
