# Specification Tables and the Plugin System

## Purpose

Specification tables provide a higher-level way to define test cases. Instead of manually listing every equivalence class for every field (as you would in a decision table), you describe each field's constraints -- its type, whether it is mandatory, minimum and maximum values, email format, regex pattern, and so on. Nanook then automatically converts these constraints into a full decision table with appropriate equivalence classes and test cases.

This approach is valuable when you have many fields with standard validation rules. Writing out all equivalence classes by hand is tedious and error-prone. A specification table lets you declare the rules once, and the `ParserSpecificationConverter` generates the equivalence classes for you.

## Table Identifier

The first cell (A1) of a specification table sheet must contain:

```
<SPECIFICATION>
```

This tells the `FileProcessor` to route the sheet to the `ParserSpecification` parser.

## Table Structure

A specification table has three distinct sections, separated by keyword markers in the first column:

1. **Fields section** (from the header row down to the `Severity` marker)
2. **Severity section** (from `Severity` to `Rule`)
3. **Rules section** (from `Rule` to `<END>`)

### Fields Section

The fields section starts at row 2 (after the header row). Each row defines one field with its associated rules.

```
     A                B                 C          D          E        F        G       ...
+----------------+-----------------+----------+----------+--------+--------+-------+
| Field Name     | Internal Name   | PK       | TYPE     | C1     | C2     | C3    |   <- Rule headers (row 2)
+----------------+-----------------+----------+----------+--------+--------+-------+
| Email          | email           |          | string   | x      |        | 255   |
| Username       | username        |          | string   | x      | 3      | 20    |
| Age            | age             |          | integer  |        | 0      | 150   |
| Account ID     | accountId       | x        | string   | x      | 1      | 36    |
+----------------+-----------------+----------+----------+--------+--------+-------+
```

- **Column A**: The display name of the field.
- **Column B**: The internal field name (used in generated code/data).
- **Column C onward**: Rule columns. The header of each column is the rule name (e.g., `PK`, `TYPE`, `C1`). The cell value is the rule's parameter for that field. An empty cell means the rule does not apply to that field.

### Severity Section

The severity section starts with the keyword `Severity` in column A. Each row defines one severity level, and cells in the rule columns indicate which rules are associated with that severity.

```
     A                B                 C          D          E        F        G       ...
+----------------+-----------------+----------+----------+--------+--------+-------+
| Severity       |                 |          |          |        |        |       |
+----------------+-----------------+----------+----------+--------+--------+-------+
| Error          |                 |          |          | x      | x      | x     |
| Warning        |                 |          |          |        |        |       |
+----------------+-----------------+----------+----------+--------+--------+-------+
```

Each rule column must have exactly one severity assigned. The parser validates this and reports an error if a rule column has no severity or more than one.

### Rules Section

The rules section starts with the keyword `Rule` in column A. Each row defines a rule with its name, short description, and long description.

```
     A                B                            C
+----------------+----------------------------+------------------------------------+
| Rule           |                            |                                    |
+----------------+----------------------------+------------------------------------+
| PK             | Primary Key                | Field is part of the primary key   |
| TYPE           | Field Type                 | Data type of the field             |
| C1             | Mandatory                  | Field must not be empty            |
| C2             | Minimum                    | Minimum value or length            |
| C3             | Maximum                    | Maximum value or length            |
| C4             | Email                      | Must be a valid email format       |
| C5             | Regular Expression         | Must match the given regex         |
+----------------+----------------------------+------------------------------------+
```

Every rule used in the fields section must be defined in the rules section, and every defined rule must be used at least once. The parser validates both conditions.

## How Conversion Works

When a `<SPECIFICATION>` sheet is parsed, the following happens:

1. `ParserSpecification` reads the fields, severities, and rules from the sheet.
2. It passes the parsed specification model to `ParserSpecificationConverter`.
3. The converter iterates over each field and its rules.
4. For each rule, it looks up a registered `RuleConverterPlugin` in the `RuleConverterRegistry` and calls its `convert()` method.
5. Each plugin returns valid and error equivalence classes.
6. The converter aggregates all equivalence classes into field sub-sections.
7. The converter generates test cases that systematically cover the error classes.
8. The result is a fully populated `TableDecision` model that can be processed by the `TestcaseProcessor` just like a hand-written decision table.

The generated decision table includes:

- An **Execute** multi-row section (with "Testcase" and "Data only" rows).
- A **Secondary Data** field section (if the specification has a primary key rule).
- A **Primary Data** field section with all the field equivalence classes.
- A **Summary** section.
- A **Severity** multi-row section.
- Automatically generated test cases, one for each error class of each field, with other fields set to valid values.

## Built-in RuleConverter Plugins

Nanook ships with seven built-in rule converter plugins. They are registered automatically when you use `createDefaultConverterRegistry()`.

### PK -- Primary Key

- **Rule name:** `PK`
- **Purpose:** Marks a field as part of the primary key.
- **Effect on equivalence classes:** The PK converter itself produces no equivalence classes. Instead, the converter creates a separate "Secondary Data" field section with "Record already exists" and "Record is new" equivalence classes at the table level.

### TYPE -- Field Type

- **Rule name:** `TYPE`
- **Purpose:** Defines the data type of the field (`string`, `integer`, `float`, `date`, `boolean`).
- **Effect on equivalence classes:** The TYPE converter is the most complex built-in converter. Its behavior depends on both the type and which other rules (C2, C3, C4, C5) are present:
  - **String** (without C4/C5): Adds valid classes for `naughty strings`, `number`, `float`, and `boolean` values to test type coercion.
  - **String with C2/C3**: Adds C2/C3 error classes with character-length messages (e.g., "Fall below min 3 chars", "Exceeds max 255 chars") and appends min/max comments to all existing valid classes.
  - **Integer/Float with C2/C3**: Same as string but with numeric messages (e.g., "Fall below min 0", "Exceeds max 150").
  - **Date with C2/C3**: Same pattern with date messages.
  - **Boolean**: Adds an error class "Not a boolean value".

### C1 -- Mandatory

- **Rule name:** `C1`
- **Purpose:** Indicates the field is mandatory (must not be empty).
- **Effect on equivalence classes:** Adds an error class `C1` with comment "Mandatory Field". When C1 is present, the base `null` (empty) valid class is removed -- meaning an empty value is no longer considered valid for this field.

### C2 -- Minimum Value/Length

- **Rule name:** `C2`
- **Purpose:** Defines the minimum value or length for the field.
- **Effect on equivalence classes:** Adds a valid class `exactly min` (the boundary value). The actual error class is generated by the TYPE converter, which uses the C2 value to produce type-specific error messages.

### C3 -- Maximum Value/Length

- **Rule name:** `C3`
- **Purpose:** Defines the maximum value or length for the field.
- **Effect on equivalence classes:** Adds a valid class `exactly max` (the boundary value). Like C2, the error class is generated by the TYPE converter.

### C4 -- Email Format

- **Rule name:** `C4`
- **Purpose:** Validates that the field contains a valid email address.
- **Effect on equivalence classes:**
  - Appends "Valid Email" to the `not null` valid class comment.
  - Adds an error class `C4` with comment "Must be valid email".

### C5 -- Regular Expression

- **Rule name:** `C5`
- **Purpose:** Validates that the field matches a given regular expression.
- **Effect on equivalence classes:**
  - Appends "Matches RegEx" to the `not null` valid class comment.
  - Adds an error class `C5` with comment "Must match the given RegEx".

## Base Equivalence Classes

Before any rule converters run, the converter establishes base equivalence classes for every field:

- `not null` (valid) -- "Not Empty". This always exists.
- `null` (valid) -- "Empty". This exists **only** if the C1 (mandatory) rule is absent for the field. When C1 is present, an empty value is an error, not a valid class.

Rule converters then add to or modify these base classes.

## Custom RuleConverter Plugins

You can create your own rule converter plugins to handle domain-specific validation rules that go beyond the built-in set. A plugin must implement the `RuleConverterPlugin` interface:

```typescript
import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from 'nanook-table'

const myPlugin: RuleConverterPlugin = {
  name: 'MY_RULE',
  description: 'Custom validation rule for my domain',

  convert(context: RuleConversionContext): EquivalenceClassResult {
    const { field, rule, allFieldRules, specification } = context

    // field: The current field being processed
    // rule: The specific rule being converted (name, value, severity)
    // allFieldRules: All rules for the current field
    // specification: The entire specification model

    return {
      validClasses: [
        { name: 'valid case', comment: 'Satisfies MY_RULE' }
      ],
      errorClasses: [
        { name: 'MY_RULE', comment: 'Violates MY_RULE constraint' }
      ]
    }
  }
}
```

### The RuleConversionContext

The `convert()` method receives a context object with the following properties:

| Property         | Type                              | Description                                                 |
|------------------|-----------------------------------|-------------------------------------------------------------|
| `field`          | `SpecificationFieldInterface`     | The field currently being processed (name, internal name, rules). |
| `rule`           | `SpecificationFieldRuleInterface` | The specific rule being converted (rule name, value, severity). |
| `allFieldRules`  | `SpecificationFieldRuleInterface[]` | All rules defined for this field. Useful when your rule's behavior depends on other rules. |
| `specification`  | `SpecificationInterface`          | The complete specification model, including all fields and rules. |

### The EquivalenceClassResult

The `convert()` method must return an `EquivalenceClassResult`:

```typescript
interface EquivalenceClassResult {
  validClasses: EquivalenceClassEntry[]
  errorClasses: EquivalenceClassEntry[]
}

interface EquivalenceClassEntry {
  name: string       // Name of the equivalence class
  comment: string    // Description/comment for the class
  severity?: string  // Optional severity override
}
```

- **validClasses**: Equivalence classes that represent valid/correct inputs.
- **errorClasses**: Equivalence classes that represent invalid inputs that should trigger errors.

If a valid class name matches an existing class (e.g., `not null`), the comment is appended to the existing class's comments. This allows multiple rules to enrich the description of the same equivalence class.

If an error class includes a `severity` property, it overrides the severity from the rule definition. Otherwise, the rule's default severity is used.

### Registering Custom Plugins

To register your plugin, start with the default registry and add your plugin:

```typescript
import {
  createDefaultConverterRegistry,
  ParserSpecificationConverter
} from 'nanook-table'

// Create a registry pre-populated with all built-in converters
const registry = createDefaultConverterRegistry()

// Register your custom plugin
registry.register(myPlugin)

// Use the registry with the converter
const converter = new ParserSpecificationConverter({ registry })
```

If you need a completely custom set of converters (without the built-in ones), create a fresh registry:

```typescript
import { RuleConverterRegistry } from 'nanook-table'

const registry = new RuleConverterRegistry()
registry.register(myPlugin)
registry.register(anotherPlugin)
```

Note that the registry enforces unique names. Attempting to register two plugins with the same name throws an error.

## Complete Specification Table Example

```
     A                B              C       D         E       F        G
+----------------+--------------+-------+---------+-------+--------+-------+
| <SPECIFICATION>|              |       |         |       |        |       |
+----------------+--------------+-------+---------+-------+--------+-------+
| Field Name     | Internal     | PK    | TYPE    | C1    | C2     | C3    |
+----------------+--------------+-------+---------+-------+--------+-------+
| Email          | email        |       | string  | x     |        | 255   |
| Username       | username     |       | string  | x     | 3      | 20    |
| Age            | age          |       | integer |       | 0      | 150   |
+----------------+--------------+-------+---------+-------+--------+-------+
| Severity       |              |       |         |       |        |       |
+----------------+--------------+-------+---------+-------+--------+-------+
| Error          |              |       | x       | x     | x      | x     |
+----------------+--------------+-------+---------+-------+--------+-------+
| Rule           |              |       |         |       |        |       |
+----------------+--------------+-------+---------+-------+--------+-------+
| PK             | Primary Key  | Field is part of the primary key          |
| TYPE           | Field Type   | The data type of the field                |
| C1             | Mandatory    | Field must not be empty                   |
| C2             | Minimum      | Minimum value or length                   |
| C3             | Maximum      | Maximum value or length                   |
+----------------+--------------+-------+---------+-------+--------+-------+
| <END>          |              |       |         |       |        |       |
+----------------+--------------+-------+---------+-------+--------+-------+
```

When processed, this specification table generates a decision table with:

- Three field sub-sections (Email, Username, Age), each with valid and error equivalence classes derived from their rules.
- Automatically generated test cases, one per error class per field, ensuring systematic coverage.
- A severity section mapping each test case to its expected severity level.

The generated decision table is then processed by the `TestcaseProcessor` exactly like any hand-written decision table.
