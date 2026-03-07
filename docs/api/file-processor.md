# File Processor API Reference

The file processor module handles loading spreadsheet files and parsing their sheets into table models. It includes the importer abstraction, individual parsers for each table type, and the specification-to-decision converter with its rule converter plugin system.

```typescript
import {
  ImporterInterface,
  ImporterXlsx,
  FileProcessor,
  ParserInterface,
  ParserDecision,
  ParserMatrix,
  ParserSpecification,
  ParserSpecificationConverter,
  RuleConverterRegistry,
  createDefaultConverterRegistry
} from 'nanook-table'
```

---

## ImporterInterface

Abstract interface for spreadsheet readers. An importer loads a file and provides cell-level access to its content. The `FileProcessor` depends on this interface, so you can replace the XLSX importer with one for a different file format.

### Methods

#### `async loadFile(fileName: string): Promise<void>`

Opens and loads the given file. After this call, the importer's sheet data is available for reading.

| Parameter | Type | Description |
|---|---|---|
| `fileName` | `string` | Path to the file to load |

#### `sheetNames(): string[]`

Returns an array of sheet names in the loaded file, in the original order they appear.

```typescript
const importer = new ImporterXlsx()
await importer.loadFile('tests.xlsx')
const sheets = importer.sheetNames()
// ['LoginTests', 'RegistrationTests', 'PaymentMatrix']
```

#### `cellValue(sheetName: string, column: number, row: number): string | undefined`

Returns the value of a single cell. Column and row indices are zero-based.

| Parameter | Type | Description |
|---|---|---|
| `sheetName` | `string` | The name of the sheet |
| `column` | `number` | Column index, starting at `0` |
| `row` | `number` | Row index, starting at `0` |

Returns `undefined` if the cell is empty.

#### `clear(): void`

Releases the loaded file data to free memory. Call this after parsing is complete.

---

## ImporterXlsx

XLSX implementation of `ImporterInterface`. Uses the `xlsx` library to read Excel files (.xlsx, .xls).

### Properties

| Property | Type | Description |
|---|---|---|
| `sheets` | `Map<string, unknown>` | Internal storage of loaded sheet data, keyed by sheet name |
| `converter` | `object` | Column name/number converter (maps Excel column letters to zero-based indices) |

### Example

```typescript
import { ImporterXlsx } from 'nanook-table'

const importer = new ImporterXlsx()
await importer.loadFile('resources/tests.xlsx')

for (const name of importer.sheetNames()) {
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
new FileProcessor({ logger }: { logger: LoggerInterface })
```

| Option | Type | Description |
|---|---|---|
| `logger` | `LoggerInterface` | Logger instance for diagnostic messages |

The `FileProcessor` requires an importer and parsers to be registered before calling `load()`. Use `createDefaultFileProcessor()` to get a pre-configured instance with all standard parsers.

### Properties

| Property | Type | Description |
|---|---|---|
| `tables` | `TableInterface[]` | Array of parsed table models. Populated after calling `load()` |

### Methods

#### `async load(fileName: string): Promise<void>`

Loads the given file, iterates over all sheets, and parses each one into a table model. The parser is selected based on the table type marker in cell `(0, 0)` of each sheet.

After this call, the `tables` property contains all parsed table models.

```typescript
import { createDefaultFileProcessor, LoggerMemory } from 'nanook-table'

const logger = new LoggerMemory()
const fp = await createDefaultFileProcessor(logger)
await fp.load('resources/tests.xlsx')

console.log(`Loaded ${fp.tables.length} tables`)
for (const table of fp.tables) {
  console.log(`- ${table.name} (${table.tableType})`)
}
```

#### `registerImporter(importer: ImporterInterface): void`

Sets the importer to use for loading files.

#### `registerParser(tableType: string, parser: ParserInterface): void`

Registers a parser for the given table type marker. When a sheet's first cell matches the marker, this parser is used.

---

## ParserInterface

Abstract interface for table parsers. Each concrete parser knows how to read a specific table type from raw spreadsheet cells and produce a table model.

### Methods

#### `parse(sheetName: string, importer: ImporterInterface): TableInterface`

Parses the sheet with the given name using the provided importer and returns a table model.

| Parameter | Type | Description |
|---|---|---|
| `sheetName` | `string` | The name of the sheet to parse |
| `importer` | `ImporterInterface` | The importer providing cell access |

**Returns:** A `TableInterface` implementation (e.g., `TableDecision`, `TableMatrix`).

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

#### `parse(sheetName: string, importer: ImporterInterface): TableDecision`

Parses the decision table and returns a `TableDecision` model.

---

## ParserMatrix

Parser for sheets marked with `<MATRIX_TABLE>`. Reads a two-dimensional matrix of test parameters and produces a `TableMatrix` model.

### Sheet Structure

A matrix table has row headers on the left, column headers on top, and data values at their intersections. Each non-empty intersection becomes a test case.

### Methods

#### `parse(sheetName: string, importer: ImporterInterface): TableMatrix`

Parses the matrix table and returns a `TableMatrix` model.

---

## ParserSpecification

Parser for sheets marked with `<SPECIFICATION_TABLE>`. Reads a high-level specification of fields, rules, and severities, and produces a `SpecificationModel`.

### Sheet Structure

A specification table has three sections:

1. **Fields** -- listed vertically with their applicable rules marked per column
2. **Severities** -- defines severity levels for rule violations
3. **Rules** -- defines the available rules and their descriptions

### Methods

#### `parseSpecification(sheetName: string, importer: ImporterInterface): SpecificationModel`

Parses the specification sheet and returns a `SpecificationModel`.

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
new ParserSpecificationConverter(options?: {
  logger?: LoggerInterface
  converterRegistry?: RuleConverterRegistry
})
```

| Option | Type | Description |
|---|---|---|
| `logger` | `LoggerInterface` | Logger instance |
| `converterRegistry` | `RuleConverterRegistry` | Registry of rule converter plugins. If not provided, uses `createDefaultConverterRegistry()` |

### Methods

#### `convert(specification: SpecificationModel): TableDecision`

Converts the specification model into a decision table.

```typescript
import {
  ParserSpecification,
  ParserSpecificationConverter,
  ImporterXlsx
} from 'nanook-table'

const importer = new ImporterXlsx()
await importer.loadFile('spec.xlsx')

const parser = new ParserSpecification()
const spec = parser.parseSpecification('MySpec', importer)

const converter = new ParserSpecificationConverter()
const decisionTable = converter.convert(spec)
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
  field: FieldDefinition

  /** The specific rule being converted */
  rule: RuleDefinition

  /** All rules that apply to this field */
  allFieldRules: RuleDefinition[]

  /** The full specification model */
  specification: SpecificationModel
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

  /** Optional explanatory comment */
  comment?: string

  /** Optional severity level for error classes */
  severity?: string
}
```

---

## RuleConverterRegistry

Registry for rule converter plugins. Used by `ParserSpecificationConverter` to look up the appropriate converter for each rule type.

### Methods

#### `register(plugin: RuleConverterPlugin): void`

Registers a converter plugin. The plugin's `name` property is used as the key.

#### `get(name: string): RuleConverterPlugin`

Returns the plugin registered under the given name. Throws an error if not found.

#### `has(name: string): boolean`

Returns `true` if a plugin with the given name is registered.

#### `names(): string[]`

Returns an array of all registered plugin names.

### Custom Rule Converter Example

```typescript
import { RuleConverterRegistry } from 'nanook-table'
import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from 'nanook-table'

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
import { createDefaultConverterRegistry } from 'nanook-table'

const registry = createDefaultConverterRegistry()
console.log(registry.names()) // list of all built-in converter names
```

---

## Parser Constants

The parsers use the following constants when reading spreadsheet data:

| Constant | Value | Description |
|---|---|---|
| `START_ROW` | `0` | Default starting row in a sheet |
| `START_COLUMN` | `0` | Default starting column in a sheet |
| `MAX_EMPTY_LINES` | `30` | Maximum consecutive empty lines before the parser assumes the table has ended |
| `KEY_TABLE_END` | `'<END>'` | Marker string in a cell that explicitly marks the end of a table |
