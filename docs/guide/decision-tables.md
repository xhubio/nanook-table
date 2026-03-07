# Decision Tables (Equivalence Class Tables)

## What is a Decision Table?

A decision table -- also called an equivalence class table -- is the primary table format in Nanook for defining test cases. The idea is rooted in equivalence class partitioning: instead of testing every possible input value, you group inputs into classes that produce equivalent behavior, then test one representative from each class.

For example, consider a field with a maximum length of 10 characters. All values with more than 10 characters trigger the same validation error, so they belong to one equivalence class ("exceeds max length"). You do not need to test with 11, 12, 13, ... characters separately.

A decision table in Nanook encodes these equivalence classes for every field and then defines test cases by selecting which class to use for each field. This gives you a compact, visual representation of your entire test matrix.

## Table Identifier

The first cell (A1) of a decision table sheet must contain the identifier:

```
<DECISION_TABLE>
```

This tells the `FileProcessor` to route the sheet to the `ParserDecision` parser.

The table ends when the parser encounters an `<END>` marker in the first column.

## Table Structure

A decision table is divided into two regions: the **left side** (columns A through E) defines the fields and their equivalence classes, while the **right side** (column F onward) defines the test cases.

```
     A              B                C                  D                 E           F      G      H
+-----------+----------------+------------------+-----------------+-----------+------+------+------+
| Field     | Section Type   | Equivalence      | Generator       | Comment   | tc1  | tc2  | tc3  |
| Name      |                | Class            | Function        |           |      |      |      |
+-----------+----------------+------------------+-----------------+-----------+------+------+------+
| ...       | ...            | ...              | ...             | ...       | ...  | ...  | ...  |
+-----------+----------------+------------------+-----------------+-----------+------+------+------+
```

### The Five Fixed Columns

| Column | Name               | Description                                                      |
|--------|--------------------|------------------------------------------------------------------|
| A      | Field Name         | The name of the field or section. Acts as a header for sections.  |
| B      | Section Type       | Identifies what kind of section this row belongs to.              |
| C      | Equivalence Class  | The name or description of the equivalence class for this row.    |
| D      | Generator Function | A directive string (`gen:...`, `ref:...`, or a static value).     |
| E      | Comment            | A free-text comment or description for documentation purposes.    |

### Test Case Columns (Column F Onward)

Each column starting at column F represents one test case. The first row of each test case column contains the test case name (e.g., `1`, `2`, `tc_login_valid`).

The parser determines the end of the test case columns by scanning the first row for the first empty cell. If you insert an empty column in the middle of your test cases, the parser will stop reading at that point.

## Left Side: Field Definitions

The left side of the table is organized into **sections**. Each section groups related rows together and serves a specific purpose.

### Markers in Test Case Cells

Within the test case columns (the right side), you use markers to indicate which equivalence class to select for each test case:

| Marker | Meaning                                                                                                  |
|--------|----------------------------------------------------------------------------------------------------------|
| `x`    | **Choose exactly this class.** The test case will use this specific equivalence class for this field.     |
| `e`    | **Choose any class.** The processor selects any valid equivalence class. Useful when the specific value does not matter for this test case, but a value is still needed. |
| `a`    | Same as `e`. Choose any valid equivalence class.                                                         |
| (empty)| This field is not relevant for this test case. No data is generated for it.                              |

If a test case column has an `x` in a row, that row's equivalence class and its generator function (column D) are used to produce data for the field. If it has an `e` or `a`, the processor picks a valid class at random.

## Section Types

Every row in the left side of a decision table belongs to a section. The section type is identified by the value in column B. Sections fall into two categories: **multi-row sections** (which span multiple rows) and **single-row sections** (which occupy exactly one row).

### Multi-Row Sections

#### FieldSection

The `FieldSection` is the primary data section of a decision table. It groups one or more `FieldSubSection` entries together. A field section acts as a logical container -- you can have as many field sections as you like to organize your fields (e.g., "Primary Data", "Secondary Data").

Having one or multiple field sections has no impact on test case generation. All field sub-sections across all field sections are combined when processing.

**Section type value:** `FieldSection`

#### FieldSubSection

A `FieldSubSection` represents one field and all its equivalence classes. Each row within a field sub-section defines one equivalence class for that field.

**Section type value:** `FieldSubSection`

**Example:**

```
     A              B                C                       D                        E
+-----------+------------------+---------------------+------------------------+-----------+
| Username  | FieldSubSection  |                     |                        |           |  <- header row
|           |                  | valid, 3-20 chars   | gen:1:faker:username   | Normal    |
|           |                  | exactly min (3)     | gen:1:faker:string:3   | Boundary  |
|           |                  | exactly max (20)    | gen:1:faker:string:20  | Boundary  |
|           |                  | too short (<3)      | gen:1:faker:string:2   | Error     |
|           |                  | too long (>20)      | gen:1:faker:string:21  | Error     |
|           |                  | empty               |                        | Error     |
+-----------+------------------+---------------------+------------------------+-----------+
```

#### MultiRowSection

A `MultiRowSection` is a user-defined section with multiple rows. These sections are not directly processed by the data generators the way field sections are, but each data generator has access to the data from multi-row sections. You can use them for:

- Expected results or error messages
- UI actions
- Pre-conditions or post-conditions
- Any other structured data your test needs

**Section type value:** `MultiRowSection`

#### TagSection

Tags are labels attached to test cases for filtering purposes. If a test case uses references to other test cases, all tags from the referenced chain are collected and available for filtering.

In the test case columns, enter the tag value to apply it to that test case, or leave it empty to omit the tag.

**Section type value:** `TagSection`

#### FilterSection

The filter section defines filters that control which test cases are included in the output. Unlike tags, filters only apply to the master test case -- if a referenced test case has a filter defined, that filter is not executed for the referencing test case.

**Section type value:** `FilterSection`

#### GeneratorSwitchSection

The generator switch section lets you disable specific generators on a per-test-case basis. Enter the generator name in the key column and mark test cases where that generator should be switched off.

**Section type value:** `GeneratorSwitchSection`

### Single-Row Sections

Single-row sections occupy exactly one row in the table.

#### ExecuteSection

The execute section controls whether a test case should be generated. Place a truthy value (e.g., `x`, `true`, `1`) in a test case column to include it, or a falsy value (e.g., `F`, `false`, `0`, or leave empty) to skip it.

A test case marked as not executed can still be used as a reference target by other test cases. This is useful for defining reusable data sets that are only generated when referenced.

**Section type value:** `ExecuteSection`

#### NeverExecuteSection

The `NeverExecuteSection` is the conceptual opposite of `ExecuteSection`, but it works differently:

- In the **ExecuteSection**, setting a test case to false means it will not be generated on its own, but it *will* be generated if referenced by another test case.
- In the **NeverExecuteSection**, setting a test case to a truthy value means the test case *will* be generated on its own, but any other test case that references it will *not* be generated.

This is useful for test cases that should exist in isolation but should prevent dependent test cases from running.

**Section type value:** `NeverExecuteSection`

#### MultiplicitySection

The multiplicity section controls how many instances of a test case should be generated. Enter a number N in the test case column, and the processor will create N copies of that test case (each with its own generated data).

If no multiplicity is set or the value is empty, the default is 1.

**Section type value:** `MultiplicitySection`

**Example:** Setting multiplicity to `10` for test case `1` produces 10 independent instances of that test case, each with freshly generated data.

#### SummarySection

The summary section is purely for documentation. It is not used by the processor or any data generator. Use it to add a human-readable summary or description to each test case column.

**Section type value:** `SummarySection`

## Complete Example

Below is a simplified decision table layout showing how the sections fit together:

```
     A                B                       C                    D                      E             F       G       H
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| <DECISION_TABLE>                                                                                                      |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
|                |                     |                   |                    |               | tc1   | tc2   | tc3   |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| Primary Data   | FieldSection        |                   |                    |               |       |       |       |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| Email          | FieldSubSection     |                   |                    |               |       |       |       |
|                |                     | valid email       | gen:1:faker:email  | Normal case   | x     |       | e     |
|                |                     | invalid format    | not-an-email       | Bad format    |       | x     |       |
|                |                     | empty             |                    | Missing       |       |       | x     |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| Password       | FieldSubSection     |                   |                    |               |       |       |       |
|                |                     | valid, 8-64 chars | gen:2:faker:pw     | Normal case   | x     | e     |       |
|                |                     | too short         | gen:2:faker:pw:3   | Below min     |       |       | x     |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| Expected       | MultiRowSection     |                   |                    |               |       |       |       |
|                |                     | Result            |                    |               | OK    | Error | Error |
|                |                     | Message           |                    |               |       | Inv.  | Req.  |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| Tags           | TagSection          |                   |                    |               |       |       |       |
|                |                     | priority          |                    |               | high  |       | high  |
|                |                     | category          |                    |               | smoke |       |       |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
|                | ExecuteSection      |                   |                    |               | x     | x     | x     |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
|                | MultiplicitySection |                   |                    |               | 1     | 1     | 5     |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
|                | SummarySection      |                   |                    |               | Happy | Bad   | Empty |
|                |                     |                   |                    |               | path  | email | email |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
| <END>          |                     |                   |                    |               |       |       |       |
+----------------+---------------------+-------------------+--------------------+---------------+-------+-------+-------+
```

In this example:

- **tc1** is the happy path: valid email (`x`), valid password (`x`).
- **tc2** tests an invalid email format (`x`), with any valid password (`e`).
- **tc3** tests an empty email (`x`) with a too-short password (`x`), and is generated 5 times due to multiplicity.
