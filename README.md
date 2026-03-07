# @xhubio/nanook-table

Nanook is a toolkit for defining test cases in Excel spreadsheets and generating test data. You describe your test scenarios using equivalence class tables, matrix tables, or specification tables in standard XLSX files, and Nanook reads those definitions, processes them through pluggable data generators, and writes the resulting test data to your chosen output format.

## Key Features

- **Equivalence class tables** -- Define fields, their equivalence classes (valid and invalid), and mark which class applies to each test case.
- **Matrix tables** -- Describe pairwise or combinatorial relationships between two dimensions of test parameters.
- **Specification tables** -- Define field rules and severities at a higher level; Nanook automatically converts them into equivalence class tables.
- **Pluggable data generators** -- Use the built-in Faker generator or write your own. Generators support instance IDs, uniqueness constraints, persistent stores, and post-processing.
- **Custom writers** -- Control how generated data is written: JSON files, databases, or any format you need.
- **Filtering** -- Include or exclude test cases at processing time using tag-based filter expressions.
- **Single package** -- Everything ships as one ESM package with TypeScript types.

## Installation

```bash
npm install @xhubio/nanook-table
```

Requires Node.js >= 22.

## Quick Start

```typescript
import path from 'node:path'
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter
} from '@xhubio/nanook-table'

async function main() {
  const logger = new LoggerMemory()
  logger.writeConsole = true

  const fileProcessor = createDefaultFileProcessor(logger)
  const generatorRegistry = createDefaultGeneratorRegistry()

  await fileProcessor.load([path.join('resources', 'tests.xlsx')])

  const tables: Record<string, any> = {}
  for (const table of fileProcessor.tables) {
    tables[table.tableName] = table
  }

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry,
    writer: [createDefaultWriter(logger)],
    tables
  })

  await processor.process()
}

main()
```

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

## Table Types

| Marker | Table Type | Description |
|---|---|---|
| `<DECISION_TABLE>` | Decision / Equivalence Class | Fields with equivalence classes, one column per test case |
| `<MATRIX_TABLE>` | Matrix | Two-dimensional parameter combinations |
| `<SPECIFICATION_TABLE>` | Specification | High-level rules that convert to a decision table |

## Writing a Custom Generator

Extend `DataGeneratorBase` and override `doGenerate()`:

```typescript
import {
  DataGeneratorBase,
  DataGeneratorGenerateRequest
} from '@xhubio/nanook-table'

class MyGenerator extends DataGeneratorBase {
  protected async doGenerate(request: DataGeneratorGenerateRequest) {
    const { instanceId, testcaseData, generatorDirective } = request
    // Generate and return your data
    return `generated-value-for-${generatorDirective?.fieldName}`
  }
}
```

Register it in a `DataGeneratorRegistry`:

```typescript
import { DataGeneratorRegistry } from '@xhubio/nanook-table'

const registry = new DataGeneratorRegistry()
const gen = new MyGenerator({ generatorRegistry: registry, name: 'myGen' })
registry.registerGenerator('myGen', gen)
```

## Writing a Custom Writer

Implement the `InterfaceWriter` interface:

```typescript
import { LoggerMemory } from '@xhubio/nanook-table'
import type { InterfaceWriter, TestcaseDataInterface } from '@xhubio/nanook-table'

const writer: InterfaceWriter = {
  logger: new LoggerMemory(),
  async before() { /* setup */ },
  async write(testcaseData: TestcaseDataInterface) {
    console.log(`Test case: ${testcaseData.name}`, testcaseData.data)
  },
  async after() { /* cleanup */ }
}
```

## Documentation

See the [docs/](docs/) directory for detailed guides, API reference, and tutorials:

- **[API Reference](docs/api/)** -- Every public class, interface, and function
- **[Guides](docs/guide/)** -- Conceptual explanations of tables, directives, and generators
- **[Tutorials](docs/tutorials/)** -- Step-by-step walkthroughs

## Development

```bash
npm install          # install dependencies
npm run build        # compile TypeScript
npm test             # run tests (vitest)
npm run lint         # run eslint
npm run format       # run prettier
npm run typecheck    # type-check without emitting
```

## License

MIT
