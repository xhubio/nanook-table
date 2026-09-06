# Directives (Generator, Reference, Static, Field)

## What are Directives?

When the `TestcaseProcessor` processes a table, it calls `createDirectives()` on each test case definition. This method inspects the generator function column (column D in a decision table, or the generator property in a matrix table) and produces a set of **directives** -- instructions that tell the processor how to produce data for each field.

Directives are the bridge between the spreadsheet definition and the actual data generation. The processor collects all directives for a test case and then fulfills them one by one until every directive has produced its data, or throws an error if any remain incomplete.

All directives share a common base (`DirectiveBase`) that carries:

- `fieldName` -- The name of the field this directive belongs to.
- `testcaseMeta` -- Meta information about the test case (file name, table name, table type, test case name).

There are four directive types: **GeneratorDirective**, **ReferenceDirective**, **StaticDirective**, and **FieldDirective**.

## GeneratorDirective

A `GeneratorDirective` instructs the processor to invoke a named data generator to produce a value.

### Syntax

```
gen:<instanceIdSuffix>:<generatorName>:<parameter>
```

| Part              | Description                                                                                      |
|-------------------|--------------------------------------------------------------------------------------------------|
| `gen:`            | Fixed prefix identifying this as a generator directive.                                           |
| `instanceIdSuffix`| An identifier for reusing the same generated data instance across fields. See "Instance IDs" below. |
| `generatorName`   | The name under which the generator is registered in the `DataGeneratorRegistry`.                  |
| `parameter`       | A string passed to the generator as configuration. The meaning depends on the specific generator. |

### Basic Example

```
gen::PersonGenerator:firstName
```

This calls the generator registered as `PersonGenerator`, passes `firstName` as the parameter, and uses no explicit instance ID (a new UUID is assigned automatically).

### Instance IDs

The instance ID mechanism solves a common problem: you need the **same** generated data set to provide values for multiple fields.

Consider a `PersonGenerator` that creates a coherent person record (first name, last name, email). If you have three separate fields in your table -- `firstName`, `lastName`, and `email` -- you want all three to come from the same generated person, not three different random people.

```
gen:1:PersonGenerator:firstName
gen:1:PersonGenerator:lastName
gen:1:PersonGenerator:email
```

Here is what happens:

1. The first call (`firstName`) creates a new person instance and stores it under instance ID `1`. The `firstName` value is returned.
2. The second call (`lastName`) finds that instance ID `1` already exists for `PersonGenerator`. Instead of generating new data, it retrieves the existing instance and returns the `lastName`.
3. The third call (`email`) works the same way -- it returns the `email` from the already-generated instance.

If you use a different instance ID (or no instance ID), a new independent data set is generated:

```
gen:1:PersonGenerator:firstName    <- Person A
gen:1:PersonGenerator:lastName     <- Person A (same instance)
gen:2:PersonGenerator:firstName    <- Person B (different instance)
gen::PersonGenerator:firstName     <- Person C (auto-generated UUID, always new)
```

### Execution Order

Generator directives have an `order` property (default: 1000). Directives with lower order numbers are executed first. This allows you to control dependencies between generators when one generator's output is needed as input for another.

### TypeScript Interface

```typescript
import type { GeneratorDirectiveInterface } from 'nanook-table'

// The interface:
interface GeneratorDirectiveInterface {
  fieldName: string
  testcaseMeta: MetaTestcase
  generatorName: string      // Name of the registered generator
  config: string             // The parameter string after the third colon
  instanceIdSuffix: string   // The instance ID for data reuse
  order: number              // Execution priority (lower = earlier)
}
```

## ReferenceDirective

A `ReferenceDirective` points to another test case -- in the same table or a different one. When the processor encounters a reference, it creates a new instance of the referenced test case (generating its data if needed) and pulls the specified field value from it.

### Syntax

```
ref:<instanceIdSuffix>:<tableName>:<fieldName>:<testcaseName>
```

| Part              | Description                                                                                  |
|-------------------|----------------------------------------------------------------------------------------------|
| `ref:`            | Fixed prefix identifying this as a reference directive.                                       |
| `instanceIdSuffix`| Instance ID for reusing the same referenced test case instance across multiple fields.        |
| `tableName`       | The name of the table containing the referenced test case. Defaults to the current table.     |
| `fieldName`       | The field to extract from the referenced test case. If omitted, no data is included.          |
| `testcaseName`    | The name of the referenced test case. This is mandatory.                                      |

> **Note:** `fieldName` comes **before** `testcaseName`. This is what the implementation reads
> (`createReferenceDirective` in `TestcaseDefinitionDecision` and `TestcaseDefinitionMatrix`
> take `parts[3]` as the field and `parts[4]` as the test case) and what the test fixtures use,
> for example `ref:1:Person_no_ref:first-name:4`.

### Basic Example

```
ref:1:PersonTable:email:tc1
```

This references test case `tc1` in the table `PersonTable`, extracts the `email` field, and stores the referenced instance under ID `1`.

### Self-Reference

A self-reference points to another field within the same test case. This is useful when one field must have the same value as another -- for example, a "confirm password" field that must match the "password" field.

```
ref:::password:
```

Or with an explicit table name:

```
ref::Person:password:
```

For a self-reference, the instance ID suffix and the test case name must be omitted (left empty). The table name is optional.

Note the **three** colons in the first form: the empty table name still needs its separator.
`ref::password:` has one colon too few -- it puts `password` in the table slot, leaves the test
case name undefined and makes the directive throw.

### Range Reference

A range reference points to multiple test cases at once, enclosed in square brackets:

```
ref::<tableName>:fieldName:[tc2-tc4]
```

This references test cases `tc2`, `tc3`, and `tc4`. To resolve a range reference, the processor must create a separate instance of the **calling** test case for each test case in the range. So if test case `T1` contains a range reference to `[tc2-tc4]`, the processor creates three instances of `T1`:

- Instance 1: references `tc2`
- Instance 2: references `tc3`
- Instance 3: references `tc4`

For range references, the instance ID suffix must be empty because each expansion needs its own independent instance of the referenced data.

### Instance IDs with References

Instance IDs work the same way as with generator directives. If two reference directives share the same instance ID and point to the same test case, they share the same generated instance:

```
ref:1:PersonTable:email:tc2    <- Creates instance of PersonTable:tc2, returns email
ref:1:PersonTable:name:tc2     <- Reuses the same instance, returns name
```

Without matching instance IDs, each reference creates a new independent instance:

```
ref::PersonTable:email:tc2     <- Instance A of PersonTable:tc2
ref::PersonTable:name:tc2      <- Instance B of PersonTable:tc2 (different data!)
```

### Default Values

| Part            | Default when omitted                                    |
|-----------------|---------------------------------------------------------|
| `tableName`     | The current table.                                      |
| `instanceIdSuffix` | A new UUID (each reference creates a new instance).  |
| `fieldName`     | No data is included (the reference still triggers generation of the target). |
| `testcaseName`  | Mandatory -- must always be specified.                  |

### TypeScript Interface

```typescript
import type { ReferenceDirectiveInterface } from 'nanook-table'

interface ReferenceDirectiveInterface {
  fieldName: string
  testcaseMeta: MetaTestcase
  targetTableName: string       // Table containing the referenced test case
  targetFieldName: string       // Field to extract from the referenced test case
  targetTestcaseName: string    // Name of the referenced test case
  instanceIdSuffix: string      // Instance ID for reference reuse
}
```

## StaticDirective

A `StaticDirective` is the simplest kind of directive. Any value in the generator function column that does **not** start with `gen:` or `ref:` is treated as static data. The value is copied as-is into the test case data object.

### Examples

```
hello@example.com          <- Static email value
42                         <- Static number (as string)
true                       <- Static boolean (as string)
some arbitrary text        <- Any text
```

### TypeScript Interface

```typescript
import type { StaticDirectiveInterface } from 'nanook-table'

interface StaticDirectiveInterface {
  fieldName: string
  testcaseMeta: MetaTestcase
  value: string               // The static value, copied as-is
}
```

## FieldDirective

A `FieldDirective` is created for each equivalence class selection in a test case. When the processor processes a decision table, it creates field directives for the multi-row sections (those that are not field sub-sections). These directives carry the key, comment, and additional data from the row.

Field directives are typically used by data generators that need access to the multi-row section data (such as expected results or error messages).

### TypeScript Interface

```typescript
import type { FieldDirectiveInterface } from 'nanook-table'

interface FieldDirectiveInterface {
  fieldName: string
  testcaseMeta: MetaTestcase
  key: string                 // Value from the "key" column
  comment: string             // Value from the "comment" column
  other: string               // Value from the "other" column
}
```

## Directive Resolution Flow

When the `TestcaseProcessor` processes a test case, the following sequence occurs:

1. `createDirectives()` is called on the test case definition, producing four arrays: `generator`, `reference`, `static`, and `field`.
2. **Static directives** are written to the test case data immediately.
3. **Field directives** are written to the test case data immediately.
4. **Reference directives** are resolved by recursively processing the referenced test cases (which may themselves contain references, generators, and static data).
5. **Generator directives** are sorted by `order` and executed via the `DataGeneratorRegistry`. Each generator's `generate()` method is called, and the result is written to the test case data.
6. After all directives are fulfilled, the `createPostProcessDirectives()` lifecycle method allows generators to perform additional processing.

This resolution continues until all directives across all test cases are satisfied.
