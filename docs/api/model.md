# Model API Reference

The model module defines the core interfaces and classes that represent tables, test case definitions, and directives. Every table type (decision, matrix, specification) implements these interfaces, and every processor operates on them.

```typescript
import {
  DirectiveBase,
  StaticDirective,
  GeneratorDirective,
  ReferenceDirective,
  FieldDirective,
  PREFIX_GENERATOR,
  PREFIX_REFERENCE
} from '@xhubio/nanook-table'
import type {
  TableInterface,
  TestcaseDefinitionInterface,
  TestcaseDirectivesInterface,
  MetaTable,
  MetaTestcase,
  FilterInterface
} from '@xhubio/nanook-table'
```

## TableInterface

Common interface implemented by all table models (`TableDecision`, `TableMatrix`). The processor operates on this interface without knowing the concrete table type.

### Properties

| Property | Type | Description |
|---|---|---|
| `tableName` | `string` | The name of this table: the sheet name. References and `TestcaseProcessor.tables` use it |
| `fileName` | `string` | The workbook the table was read from |
| `tableType` | `string` (read-only) | `'decision-table'` (`TABLE_TYPE_DECISION_TABLE`) or `'matrix-table'` (`TABLE_TYPE_MATRIX_TABLE`); specification sheets become decision tables |
| `tableMeta` | `MetaTable` (read-only) | `fileName`, `tableName` and `tableType` in one object |
| `logger` | `LoggerInterface` | The logger of the table |

### Methods

#### `getTestcaseForName(testcaseName: string): TestcaseDefinitionInterface`

Returns the test case definition with the given name. Throws an error if no test case with that name exists in the table.

```typescript
const table: TableInterface = // ... loaded table
const tc = table.getTestcaseForName('tc1')
console.log(tc.testcaseMeta.testcaseName, tc.execute)
```

#### `getTestcasesForExecution(): Generator<TestcaseDefinitionInterface>`

A generator function that yields all test case definitions that should be executed. In a decision table these are the columns with a true Execute value, each once per Multiplicity (named `<column>.1`, `<column>.2`, …); NeverExecute only takes effect when another test case references the column.

```typescript
for (const tc of table.getTestcasesForExecution()) {
  console.log(tc.testcaseMeta.testcaseName)
}
```

#### `processRanges(testcaseName: string): string[]`

Parses a test case name that may contain a range expression and returns an array of individual test case names. A range is written in square brackets, with comma-separated elements: `'[tc12-14]'` expands to `['tc12', 'tc13', 'tc14']`, `'[1,5]'` to `['1', '5']`. A name without brackets returns a single-element array.

```typescript
const names = table.processRanges('[tc3-5]')
// ['tc3', 'tc4', 'tc5']
```

---

## TestcaseDefinitionInterface

Interface for a single test case definition within a table. Each column in a decision table or each combination in a matrix table produces one test case definition.

### Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (UUID) for this test case |
| `testcaseMeta` | `MetaTestcase` (read-only) | `fileName`, `tableName`, `tableType` and `testcaseName` (e.g. `'tc1'`) |
| `data` | `any` (optional) | The cell data for this test case, keyed by row ID |
| `execute` | `boolean` | Whether this test case should be executed. `false` means it exists only as a reference target |
| `neverExecute` | `boolean` | If `true`, a test case that references this one is dropped |
| `multiplicity` | `number` | How many times this test case should be generated. Default is `1` |
| `table` | `TableInterface` | Reference back to the table this test case belongs to |
| `logger` | `LoggerInterface` | The logger |

### Methods

#### `createDirectives(): TestcaseDirectivesInterface`

Analyzes the test case data and creates all directives needed to generate this test case. This is the primary method that translates spreadsheet cell values into actionable generation instructions.

```typescript
const directives = testcase.createDirectives()

for (const sd of directives.static) {
  console.log(`Static: ${sd.fieldName} = ${sd.value}`)
}

for (const gd of directives.generator) {
  console.log(`Generator: ${gd.fieldName} -> ${gd.generatorName}`)
}

for (const rd of directives.reference) {
  console.log(`Reference: ${rd.fieldName} -> ${rd.targetTableName}.${rd.targetFieldName}`)
}
```

#### `createTags(): string[]`

Returns all tags defined for this test case. Tags come from `TagSection` rows in the table and are used for filtering.

```typescript
const tags = testcase.createTags()
// ['smoke', 'regression', 'login']
```

#### `createFilter(): FilterInterface[]`

Returns all filter definitions for this test case. Each filter names a filter processor and an expression.

```typescript
const filters = testcase.createFilter()
for (const f of filters) {
  console.log(`Filter: ${f.filterProcessorName} = ${f.expression}`)
}
```

#### `createGeneratorSwitches(): string[]`

Returns a list of generator names that should be switched off (not executed) for this test case.

```typescript
const switches = testcase.createGeneratorSwitches()
// ['generatorPassword'] -- this generator will be skipped
```

---

## TestcaseDirectivesInterface

The return type of `createDirectives()`. Groups all directives by type.

```typescript
interface TestcaseDirectivesInterface {
  generator: GeneratorDirectiveInterface[]
  static: StaticDirectiveInterface[]
  reference: ReferenceDirectiveInterface[]
  field: FieldDirectiveInterface[]
}
```

---

## DirectiveBase

Abstract base class for all directive types. Contains the metadata common to every directive.

### Properties

| Property | Type | Description |
|---|---|---|
| `fieldName` | `string` | The name of the field this directive applies to |
| `testcaseMeta` | `MetaTestcase` | Metadata about the test case and table this directive originates from |

---

## StaticDirective

Extends `DirectiveBase`. Represents a literal value that should be written directly to the test case output without calling a generator.

### Properties

| Property | Type | Description |
|---|---|---|
| `fieldName` | `string` | Inherited from `DirectiveBase` |
| `testcaseMeta` | `MetaTestcase` | Inherited from `DirectiveBase` |
| `value` | `string` | The static value to write |

In the spreadsheet, any cell value in the generator column that does not start with a recognized prefix (`gen:` or `ref:`) is treated as static data.

---

## GeneratorDirective

Extends `DirectiveBase`. Represents a call to a named data generator. Created when a cell value starts with the `gen:` prefix.

### Properties

| Property | Type | Description |
|---|---|---|
| `fieldName` | `string` | Inherited from `DirectiveBase` |
| `testcaseMeta` | `MetaTestcase` | Inherited from `DirectiveBase` |
| `generatorName` | `string` | The registered name of the generator to call |
| `config` | `string` | Everything after the third colon of the cell, passed to the generator (`person.firstName`) |
| `instanceIdSuffix` | `string` | The second part of the cell; empty for `gen::`. Directives with the same suffix in one test case share an instance ID |
| `order` | `number` | Execution order. Directives are sorted by this value before execution. Default is `1000` |

### Spreadsheet Syntax

```
gen:<instanceIdSuffix>:<generatorName>:<config>
```

Examples:
- `gen::faker:person.firstName` -- call the generator registered as `faker` with the config `person.firstName`
- `gen:pwd:password:8` -- call the generator registered as `password` with the config `8`; instance ID suffix `pwd`

Full description: [`docs/guide/directives.md`](../guide/directives.md).

---

## ReferenceDirective

Extends `DirectiveBase`. Represents a reference to data generated by another table and test case. Created when a cell value starts with the `ref:` prefix.

### Properties

| Property | Type | Description |
|---|---|---|
| `fieldName` | `string` | Inherited from `DirectiveBase` |
| `testcaseMeta` | `MetaTestcase` | Inherited from `DirectiveBase` |
| `targetTableName` | `string` | The name of the table being referenced |
| `targetFieldName` | `string` | The field name in the target table |
| `targetTestcaseName` | `string` | The test case name in the target table |
| `instanceIdSuffix` | `string` | The second part of the cell; may be empty |

### Spreadsheet Syntax

```
ref:<instanceIdSuffix>:<targetTableName>:<targetFieldName>:<targetTestcaseName>
```

The instance ID suffix is the **second** part, not a trailing parenthesis: the implementation
reads `parts[1]` for it (see `createReferenceDirective`). Full description with examples:
[`docs/guide/directives.md`](../guide/directives.md).

---

## FieldDirective

Extends `DirectiveBase`. Represents a marked row of a MultiRowSection (for example an Expected Result row). Each one becomes an entry `{ key, comment, other }` in the array the field holds in the test case data.

### Properties

| Property | Type | Description |
|---|---|---|
| `fieldName` | `string` | Inherited from `DirectiveBase`: the name of the section |
| `testcaseMeta` | `MetaTestcase` | Inherited from `DirectiveBase` |
| `key` | `string` | Column C of the row |
| `other` | `string` | Column D of the row |
| `comment` | `string` | Column E of the row |

---

## FilterInterface

Defines a filter that can be applied to test cases during processing.

### Properties

| Property | Type | Description |
|---|---|---|
| `filterProcessorName` | `string` | The name of the filter processor to use |
| `expression` | `string` | The filter expression passed to the filter processor |
| `comment` | `string` (optional) | The comment of the FilterSection row |

---

## MetaTable

Metadata about a table's origin.

### Properties

| Property | Type | Description |
|---|---|---|
| `fileName` | `string` | The source file path |
| `tableName` | `string` | The name of the table (sheet name) |
| `tableType` | `string` | The type of the table |

---

## MetaTestcase

Metadata about a specific test case. Extends the table metadata with test case identification.

### Properties

| Property | Type | Description |
|---|---|---|
| `fileName` | `string` | The source file path |
| `tableName` | `string` | The name of the table |
| `tableType` | `string` | The type of the table |
| `testcaseName` | `string` | The name of the test case |

---

## Constants

| Constant | Value | Description |
|---|---|---|
| `PREFIX_GENERATOR` | `'gen:'` | The prefix that identifies generator commands in cell values (compared case-insensitively) |
| `PREFIX_REFERENCE` | `'ref:'` | The prefix that identifies reference commands in cell values (compared case-insensitively) |
