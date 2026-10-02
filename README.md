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
import fs from 'node:fs/promises'
import {
  LoggerMemory,
  TestcaseProcessor,
  createDefaultFileProcessor,
  DataGeneratorRegistry,
  GeneratorFaker,
  type InterfaceWriter
} from '@xhubio/nanook-table'

async function main() {
  const logger = new LoggerMemory()
  logger.writeConsole = true

  const fileProcessor = createDefaultFileProcessor(logger)
  // the registry starts empty: register every generator your tables call (gen::faker:...)
  const generatorRegistry = new DataGeneratorRegistry()
  generatorRegistry.registerGenerator(
    'faker',
    new GeneratorFaker({ generatorRegistry, name: 'faker', logger })
  )

  await fileProcessor.load([path.join('resources', 'tests.xlsx')])

  const tables: Record<string, any> = {}
  for (const table of fileProcessor.tables) {
    tables[table.tableName] = table
  }

  // one JSON file per test case; see "Writing a Custom Writer" below
  const writer: InterfaceWriter = {
    logger,
    async before() {
      await fs.mkdir('tdg', { recursive: true })
    },
    async write(tc) {
      await fs.writeFile(path.join('tdg', `${tc.tableName}.${tc.name}.json`), JSON.stringify(tc, null, 2))
    },
    async after() {}
  }

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry,
    writer: [writer],
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

## Use with AI agents

[![skills.sh](https://skills.sh/b/xhubio/nanook-table)](https://skills.sh/xhubio/nanook-table)

The nanook.xhub skill `create-equivalence-class-table` drafts a decision table for a form, page or API
as a formatted XLSX, checks its coverage and generates the test data. It lives in
[`skills/`](skills/create-equivalence-class-table/SKILL.md) and ships in the npm package. It is listed on
[skills.sh](https://skills.sh/xhubio/nanook-table/create-equivalence-class-table), and the docs are
indexed on [Context7](https://context7.com/xhubio/nanook-table).

**Claude Code** (CLI, desktop, web, IDE), as a plugin:

```
/plugin marketplace add xhubio/nanook-table
/plugin install nanook@nanook
/nanook:create-equivalence-class-table Login form with email and password
```

**Other agents** (Codex, Cursor, Copilot, Gemini CLI and others that read
[Agent Skills](https://agentskills.io)):

```bash
npx skills add xhubio/nanook-table --skill create-equivalence-class-table
```

**Any agent that reads `AGENTS.md`**: paste the block from
[docs/agents-snippet.md](docs/agents-snippet.md) into your project's `AGENTS.md`. It points the agent
to the Markdown docs in `node_modules/@xhubio/nanook-table/docs/`, which match the installed version.

The generated script needs `exceljs` in your project (`npm install -D exceljs`). Setup for each agent,
the docs as plain text (`llms.txt`) and how to check what the agent produced:
[nanook.xhub.io/docs/guide/use-with-ai](https://nanook.xhub.io/docs/guide/use-with-ai).

## Development

```bash
npm install          # install dependencies
npm run build        # compile TypeScript
npm test             # run tests (vitest)
npm run lint         # run eslint
npm run format       # run prettier
npm run typecheck    # type-check without emitting
```

## Support

Questions, bugs and ideas go to the [issue tracker](https://github.com/xhubio/nanook-table/issues). It is free and public, and we answer when we find the time.

Nanook is built by [xhub.io](https://xhub.io) (BeeBack UG, Frankfurt am Main). If your team needs more than that — a review of your decision tables, custom generators or writers, Nanook in your CI pipeline, or a support contract with an answer on the next working day — we can be hired for it. See [nanook.xhub.io/support](https://nanook.xhub.io/support) or write to [nanook@xhub.io](mailto:nanook@xhub.io).

## License

MIT
