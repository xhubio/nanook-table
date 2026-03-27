# AGENTS.md — AI Assistant Instructions for nanook-table

> This file provides context and instructions for AI coding assistants
> (Claude Code, GitHub Copilot, Cursor, Windsurf, OpenAI Codex, etc.)
> working in this repository.

## Project Overview

**nanook-table** (`@xhubio/nanook-table`) is a toolkit for test case and test data creation. Users define test cases in Excel/XLSX spreadsheets (decision tables, matrix tables, specification tables), and nanook-table parses, validates, and generates test data from them.

This is a single-package ESM TypeScript project that consolidates the former `@xhubiotable/*` packages (now deprecated) into one cohesive library.

- **npm package**: `@xhubio/nanook-table`
- **Node.js**: >= 22
- **Module system**: ESM (NodeNext)
- **Documentation website**: [nanook.io](https://nanook.io)

## Build & Development Commands

```bash
npm install            # install dependencies
npm run build          # tsc -p tsconfig.build.json
npm test               # format + lint + build + vitest with coverage
npm run lint           # eslint only
npm run format         # prettier --write
npm run format:check   # prettier --check (CI)
npm run typecheck      # tsc --noEmit (type check without emitting)
```

Run a single test file:
```bash
npx vitest run tests/path/to/file.test.ts
```

CI uses the full `npm test` pipeline. Versioning is automated via semantic-release — never set versions manually in `package.json`.

## Architecture & Data Flow

```
Excel/XLSX File
    |  ImporterXlsx (reads raw cells)
    v
FileProcessor (dispatches to parser by table type)
    |-- ParserDecision      --> TableDecision (model-decision)
    |-- ParserMatrix        --> TableMatrix (model-matrix)
    '-- ParserSpecification --> converts rules to equivalence classes
    v
Table Models (TableDecision, TableMatrix)
    |  TestcaseProcessor (main orchestrator)
    |-- DataGeneratorRegistry (holds generators like GeneratorFaker)
    |-- Directive system (field/generator/reference/static)
    '-- InterfaceWriter[] (pluggable output writers)
    v
Generated Test Data (JSON files or custom output)
```

### Source Code Structure

All source code lives under `src/` organized by module:

| Directory | Purpose |
|-----------|---------|
| `logger/` | Logger facade (LoggerInterface, LoggerMemory for testing) |
| `model/` | Core interfaces (TableInterface, TestcaseDefinitionInterface) and Directive system (Field, Generator, Reference, Static) |
| `model-decision/` | Decision/equivalence-class table model with 13 section types, serializer/deserializer, validation |
| `model-matrix/` | Matrix/pairwise table model |
| `data-generator/` | Abstract DataGeneratorBase with lifecycle hooks, DataGeneratorRegistry, built-in GeneratorFaker (@faker-js/faker) |
| `importer-xlsx/` | XLSX file reader (ImporterXlsx) |
| `file-processor/` | Parsers converting raw spreadsheet data into table models, includes SpecificationConverter with plugin-based RuleConverterRegistry |
| `processor/` | Core orchestrator (TestcaseProcessor), filter system, writer interface, factory functions |

### Key Classes

- **TestcaseProcessor** (`processor/`) — Central orchestrator. Lifecycle: `before() -> process() -> after()`. Builds a Node tree, applies filters, generates data, writes output.
- **TableDecision** (`model-decision/`) — Decision table model with 13 section types (Field, Execute, Filter, Tag, Multiplicity, GeneratorSwitch, Summary, etc.)
- **TableMatrix** (`model-matrix/`) — Matrix/combinatorial table model.
- **DataGeneratorBase** (`data-generator/`) — Abstract base with lifecycle: `loadStore -> generate -> createPostProcessDirectives -> postProcess -> saveStore`.
- **FileProcessor** (`file-processor/`) — Orchestrates parsing. Maps table types to parsers.
- **ImporterXlsx** (`importer-xlsx/`) — Reads XLSX files into raw cell arrays.

### Factory Functions

```typescript
import {
  createDefaultGeneratorRegistry,  // returns EMPTY registry — register generators manually
  createDefaultWriter,             // DefaultWriter (JSON output to tdg/)
  createDefaultFileProcessor       // FileProcessor with all parsers pre-registered
} from '@xhubio/nanook-table'
```

**Important**: `createDefaultGeneratorRegistry()` returns an empty registry. You must manually register generators (e.g., `GeneratorFaker`).

## Code Style & Conventions

- **No semicolons** — Prettier removes them (`"semi": false`)
- **Single quotes**, no trailing commas
- **Naming**: PascalCase for classes/interfaces, camelCase for functions/methods/properties, camelCase or UPPER_CASE for constants
- **Max 3 function parameters**
- **No namespace imports** — `import { specific } from 'module'`, not `import * as mod from 'module'`
- **ESM imports**: Always use `.js` extension in relative imports (TypeScript NodeNext resolution)
- **xlsx import**: Use `import XLSX from 'xlsx'` (default import), NOT `import * as XLSX from 'xlsx'` — the namespace import breaks at runtime
- **Async rules**: `require-await` and `no-floating-promises` enforced by ESLint
- **TSDoc**: Syntax warnings enabled via ESLint plugin

## Test Conventions

- **Framework**: Vitest 4.x
- **Location**: `tests/` directory, mirroring `src/` structure
- **Pattern**: `*.test.ts`
- **Fixtures**: XLSX files and JSON data in `tests/**/fixtures/`
- **Volatile output**: `tests/processor/volatile/` (temp test outputs, gitignored)
- **Coverage**: v8 provider, reported as text + html

## Decision Table Concepts

Key domain concepts for understanding the codebase:

- **Markers**: `x` = select (exactly one per target field), `a` = preferred, `e` = fallback, `i` = impossible (counts for coverage)
- **Sections**: A decision table has multiple sections (Field, Execute, Filter, Tag, Multiplicity, GeneratorSwitch, Summary, NeverExecute)
- **Directives**: Instructions attached to fields — Generator (invoke data generator), Reference (cross-field dependency), Static (hardcoded value), Field (metadata)
- **TestcaseOrder**: Contains UUIDs, not testcase names. Access via `table.testcases[uuid]`

## Common Pitfalls

1. `createDefaultGeneratorRegistry()` returns an EMPTY registry — always register generators
2. xlsx must be imported as default import, not namespace import
3. ExecuteSection boolean values must match `/^[tyj]$|^1$|^yes$|^ja$|^si$|^true$|^ok$/i` — `'x'` is NOT recognized as true
4. Relative imports need `.js` extension (ESM NodeNext resolution)
