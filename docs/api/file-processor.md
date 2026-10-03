# File Processor API Reference

The file processor module handles loading spreadsheet files and parsing their sheets into table models. It includes the importer abstraction, individual parsers for each table type, and the specification-to-decision converter with its rule converter plugin system.

```typescript
import {
  ImporterXlsx,
  FileProcessor,
  ParserDecision,
  ParserMatrix,
  ParserSpecification,
  ParserSpecificationConverter,
  RuleConverterRegistry,
  createDefaultConverterRegistry
} from '@xhubio/nanook-table'
import type {
  ImporterInterface,
  ParserInterface,
  ParserParseRequest
} from '@xhubio/nanook-table'
```

---

## ImporterInterface

The interface for spreadsheet readers (a type). An importer loads a file and provides cell-level access to its content. The `FileProcessor` depends on this interface, so you can replace the XLSX importer with one for a different file format.

### Methods

#### `async loadFile(fileName: string): Promise<void>`

Opens and loads the given file. After this call, the importer's sheet data is available for reading.

| Parameter | Type | Description |
|---|---|---|
| `fileName` | `string` | Path to the file to load |

#### `sheetNames: string[]` (property)

The sheet names of the loaded file, in the order they appear. In `ImporterXlsx` it is a getter: read it, do not call it.

```typescript
const importer = new ImporterXlsx()
await importer.loadFile('tests.xlsx')
const sheets = importer.sheetNames
// ['LoginTests', 'RegistrationTests', 'PaymentMatrix']
```

#### `cellValue(sheetName: string, columnNumber: number, rowNumber: number): number | string | undefined`

Returns the value of a single cell. Column and row indices are zero-based.

| Parameter | Type | Description |
|---|---|---|
| `sheetName` | `string` | The name of the sheet |
| `columnNumber` | `number` | Column index, starting at `0` |
| `rowNumber` | `number` | Row index, starting at `0` |

Returns `undefined` if the cell is empty.

#### `cellValueString(sheetName: string, columnNumber: number, rowNumber: number): string | undefined`

Like `cellValue()`, but returns the value as a string. The parsers use this one.

#### `logger: LoggerInterface` (property)

The logger of the importer.

#### `clear(): void`

Releases the loaded file data to free memory. Call this after parsing is complete.

---

## ImporterXlsx

XLSX implementation of `ImporterInterface`. Uses the `xlsx` library to read Excel files (.xlsx, .xls). The constructor takes `{ logger? }`.

### Properties

| Property | Type | Description |
|---|---|---|
| `sheets` | `Map<string, unknown>` | Internal storage of loaded sheet data, keyed by sheet name |
| `converter` | `object` | Column name/number converter (maps Excel column letters to zero-based indices) |

### Example

```typescript
import { ImporterXlsx } from '@xhubio/nanook-table'

const importer = new ImporterXlsx()
await importer.loadFile('resources/tests.xlsx')

for (const name of importer.sheetNames) {
  const firstCell = importer.cellValue(name, 0, 0)
  console.log(`Sheet "${name}" starts with: ${firstCell}`)
}

importer.clear()
```

---

## FileProcessor

Orchestrates the loading and parsing of spreadsheet files. It uses an importer to read cells and delegates to registered parsers based on the table type marker found in each sheet's first cell.

### Constructor

```typescript
new FileProcessor(options?: { logger?: LoggerInterface; tableTypeKeys?: string[] })
```

| Option | Type | Description |
|---|---|---|
| `logger` | `LoggerInterface` | Logger instance for diagnostic messages. Default: the shared `getLoggerMemory()` instance |
| `tableTypeKeys` | `string[]` | Stored, but not evaluated: which sheets are loaded depends only on the parsers registered with `registerParser()`. A sheet whose first cell names no registered parser is skipped with an info message |

The `FileProcessor` requires an importer and parsers to be registered before calling `load()`. Use `createDefaultFileProcessor()` to get a pre-configured instance with all standard parsers.

### Properties

| Property | Type | Description |
|---|---|---|
| `tables` | `TableInterface[]` | Array of parsed table models. Populated after calling `load()`. A second sheet with the same name replaces the first (a warning is logged). `TestcaseProcessor` wants them keyed by `tableName`; convert the array |

### Methods

#### `async load(fileNames: string | string[]): Promise<void>`

Loads the given file or files, iterates over all sheets, and parses each one into a table model. The importer is selected by the file extension, the parser by the table type marker in cell `(0, 0)` of each sheet.

After this call, the `tables` property contains all parsed table models. `load()` does not throw: a file it cannot read or a sheet it cannot parse is logged as an error, so check `logger.entries.error`.

```typescript
import { createDefaultFileProcessor, LoggerMemory } from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const fp = createDefaultFileProcessor(logger)
await fp.load('resources/tests.xlsx')

console.log(`Loaded ${fp.tables.length} tables`)
for (const table of fp.tables) {
  console.log(`- ${table.tableName} (${table.tableType})`)
}
```

#### `registerImporter(extension: string, importer: ImporterInterface): void`

Registers the importer for files with the given extension, without the dot (`'xlsx'`, `'xls'`).

#### `registerParser(tableType: string, parser: ParserInterface): void`

Registers a parser for the given table type marker. When a sheet's first cell matches the marker, this parser is used.

---

## ParserInterface

The interface for table parsers (a type). Each concrete parser knows how to read a specific table type from raw spreadsheet cells and produce a table model. Besides `parse()` it has the properties `startRow`, `startColumn`, `endKey` and `logger`. The built-in parsers extend `ParserBase`, whose constructor requires `{ logger }`: `new ParserDecision({ logger })`.

### Methods

#### `parse(request: ParserParseRequest): TableInterface | undefined`

Parses one sheet and returns a table model, or `undefined` if the sheet could not be parsed (the errors are logged).

| Field of `request` | Type | Description |
|---|---|---|
| `sheetName` | `string` | The name of the sheet to parse |
| `importer` | `ImporterInterface` | The importer providing cell access |
| `fileName` | `string` | The file the sheet comes from |

**Returns:** A `TableInterface` implementation (e.g., `TableDecision`, `TableMatrix`), or `undefined`.

---

## ParserDecision

Parser for sheets marked with `<DECISION_TABLE>`. Reads the sheet structure -- sections, sub-sections, field definitions, and test case columns -- and produces a `TableDecision` model.

### Sheet Structure

A decision table sheet has the following structure:

```
Row 0:  <DECISION_TABLE>   |  tc1  |  tc2  |  tc3  | ...
        ─────────────────────────────────────────────────
        FieldSection: "Login Data"
          userId            |  x    |       |  x    |
          password          |       |  x    |  x    |
        TagSection: "Tags"
          smoke             |  x    |       |  x    |
        FilterSection: "Filter"
          myFilter          |  val  |       |  val  |
        ExecuteSection
        NeverExecuteSection
        MultiplicitySection
        SummarySection: "Summary"
          expected result   |  err  |  err  |  ok   |
        <END>
```

### Recognized Section Types

| Section Marker | Handler | Description |
|---|---|---|
| `FieldSection` | `handleFieldSection` | Defines fields with sub-sections for equivalence classes |
| `TagSection` | `handleTagSection` | Defines tags for test case filtering |
| `FilterSection` | `handleFilterSection` | Defines filter expressions per test case |
| `GeneratorSwitchSection` | `handleGeneratorSwitchSection` | Lists generators to disable per test case |
| `MultiplicitySection` | `handleMultiplicitySection` | Sets how many times each test case is generated |
| `ExecuteSection` | `handleExecuteSection` | Controls whether each test case is executed |
| `NeverExecuteSection` | `handleNeverExecuteSection` | Marks test cases as never executed |
| `SummarySection` | `handleSummarySection` | Free-text summary information |
| `MultiRowSection` | `handleMultiRowSection` | Generic multi-row data section |

### Methods

#### `parse(request: ParserParseRequest): TableInterface | undefined`

Parses the decision table and returns a `TableDecision` model.

---

## ParserMatrix

Parser for sheets marked with `<MATRIX_TABLE>`. Reads a two-dimensional matrix of test parameters and produces a `TableMatrix` model.

### Sheet Structure

A matrix table has row headers on the left, column headers on top, and data values at their intersections. Each non-empty intersection becomes a test case.

### Methods

#### `parse(request: ParserParseRequest): TableInterface | undefined`

Parses the matrix table and returns a `TableMatrix` model.

---

## ParserSpecification

Parser for sheets marked with `<SPECIFICATION>` (the legacy marker `<SPECIFICATION_TABLE>` works too). Reads a high-level specification of fields, rules, and severities into a `SpecificationModel`; `parse()` converts that into a `TableDecision` right away, so a specification sheet arrives in `FileProcessor.tables` as a decision table.

### Sheet Structure

A specification table has three sections:

1. **Fields** -- listed vertically with their applicable rules marked per column
2. **Severities** -- defines severity levels for rule violations
3. **Rules** -- defines the available rules and their descriptions

### Methods

#### `parse(request: ParserParseRequest): TableInterface | undefined`

Parses the specification sheet and returns the converted `TableDecision`.

#### `parseSpecification(sheetName: string, importer: ImporterInterface): SpecificationModel | undefined`

Parses the specification sheet and returns the `SpecificationModel`, without converting it.

---

## ParserSpecificationConverter

Converts a `SpecificationModel` into a `TableDecision`. This is the bridge between the high-level specification format and the concrete decision table that the processor can execute.

The converter creates:
- A primary data section with equivalence classes derived from the field rules
- An execution section
- A severity section
- A secondary data section (if a primary key rule is present)
- A summary section

### Constructor

```typescript
new ParserSpecificationConverter(options?: { registry?: RuleConverterRegistry })
```

| Option | Type | Description |
|---|---|---|
| `registry` | `RuleConverterRegistry` | Registry of rule converter plugins. If not provided, uses `createDefaultConverterRegistry()` |

### Methods

#### `convert(request: { specification: SpecificationInterface; logger: LoggerInterface; fileName: string }): TableDecision`

Converts the specification model into a decision table.

```typescript
import {
  LoggerMemory,
  ParserSpecification,
  ParserSpecificationConverter,
  ImporterXlsx
} from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const importer = new ImporterXlsx({ logger })
await importer.loadFile('spec.xlsx')

const parser = new ParserSpecification({ logger })
const spec = parser.parseSpecification('MySpec', importer)

if (spec !== undefined) {
  const converter = new ParserSpecificationConverter()
  const decisionTable = converter.convert({ specification: spec, logger, fileName: 'spec.xlsx' })
}
```

---

## RuleConverterPlugin

Interface for plugins that convert specification rules into equivalence classes. Each plugin handles one type of rule.

```typescript
interface RuleConverterPlugin {
  /** Unique name identifying this converter */
  name: string

  /** Human-readable description of what this converter does */
  description: string

  /** Convert a rule into equivalence classes */
  convert(context: RuleConversionContext): EquivalenceClassResult
}
```

---

## RuleConversionContext

Context object passed to `RuleConverterPlugin.convert()`. Contains all information needed to derive equivalence classes from a rule.

```typescript
interface RuleConversionContext {
  /** The field definition being processed */
  field: SpecificationFieldInterface

  /** The specific rule being converted */
  rule: SpecificationFieldRuleInterface

  /** All rules that apply to this field */
  allFieldRules: SpecificationFieldRuleInterface[]

  /** The full specification model */
  specification: SpecificationInterface
}
```

---

## EquivalenceClassResult

The return type of a rule converter plugin. Contains the valid and error equivalence classes derived from a rule.

```typescript
interface EquivalenceClassResult {
  validClasses: EquivalenceClassEntry[]
  errorClasses: EquivalenceClassEntry[]
}
```

---

## EquivalenceClassEntry

A single equivalence class within a result.

```typescript
interface EquivalenceClassEntry {
  /** Display name of the equivalence class */
  name: string

  /** Explanatory comment (required; may be an empty string) */
  comment: string

  /** Optional severity level for error classes */
  severity?: string
}
```

---

## RuleConverterRegistry

Registry for rule converter plugins. Used by `ParserSpecificationConverter` to look up the appropriate converter for each rule type.

### Methods

#### `register(plugin: RuleConverterPlugin): void`

Registers a converter plugin. The plugin's `name` property is used as the key. Throws if a plugin with that name is already registered.

#### `get(name: string): RuleConverterPlugin | undefined`

Returns the plugin registered under the given name, or `undefined`.

#### `has(name: string): boolean`

Returns `true` if a plugin with the given name is registered.

#### `names(): string[]`

Returns an array of all registered plugin names.

### Custom Rule Converter Example

```typescript
import { RuleConverterRegistry } from '@xhubio/nanook-table'
import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '@xhubio/nanook-table'

const myPlugin: RuleConverterPlugin = {
  name: 'maxLength',
  description: 'Generates classes for maximum length validation',
  convert(context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [
        { name: 'within limit', comment: 'Value within max length' }
      ],
      errorClasses: [
        { name: 'exceeds limit', comment: 'Value exceeds max length' }
      ]
    }
  }
}

const registry = new RuleConverterRegistry()
registry.register(myPlugin)
```

---

## createDefaultConverterRegistry()

Factory function that creates a `RuleConverterRegistry` pre-populated with all built-in rule converter plugins.

```typescript
import { createDefaultConverterRegistry } from '@xhubio/nanook-table'

const registry = createDefaultConverterRegistry()
console.log(registry.names()) // list of all built-in converter names
```

---

## Parser Constants

The parsers use the following internal constants when reading spreadsheet data. They are not exported; they are listed so you know how a sheet is read:

| Constant | Value | Description |
|---|---|---|
| `START_ROW` | `0` | Default starting row in a sheet |
| `START_COLUMN` | `0` | Default starting column in a sheet |
| `MAX_EMPTY_LINES` | `100` | Maximum consecutive empty lines before the parser assumes the table has ended |
| `KEY_TABLE_END` | `'<END>'` | Marker string in a cell that explicitly marks the end of a table |
