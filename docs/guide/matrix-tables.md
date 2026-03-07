# Matrix Tables

## Purpose

The matrix table format -- formally called the Predecessor-Successor Matrix Table -- is used to define state transitions or changes applied to an existing state. While decision tables define the initial creation of test data (e.g., creating a user account), matrix tables describe what happens next (e.g., applying transactions to that account, changing a status, or navigating between states).

A matrix table defines:

- A **source section** representing current states (the "predecessors").
- An **actions section** representing state changes (the "successors").
- A **matrix** that maps which actions apply to which source states.

Each non-empty cell in the matrix becomes its own test case.

## Table Identifier

The first cell (A1) of a matrix table sheet must contain:

```
<MATRIX_TABLE>
```

This tells the `FileProcessor` to route the sheet to the `ParserMatrix` parser. The table ends at the `<END>` marker.

## Table Structure

A matrix table has a different layout from a decision table. Instead of fixed columns on the left and test case columns on the right, a matrix table uses **rows and columns** to form a two-dimensional grid where one dimension represents source states and the other represents actions.

### Header Definitions

Both the rows and columns share a common header structure. Each row or column in the matrix has the following meta information:

| Property    | Description                                                                |
|-------------|----------------------------------------------------------------------------|
| Name        | The display name of the row or column.                                     |
| Short Name  | A shortened identifier used in test case naming.                           |
| Execute     | Whether combinations involving this row or column should be executed.       |
| Position    | A unique position identifier for referencing.                              |
| Generator   | A directive string (`gen:...`, `ref:...`, or static value) for data generation. |
| Description | An optional description for documentation purposes.                        |

### Source and Actions

The matrix table is divided into two logical sections:

- **Source section** -- Represents the current state or precondition. Each entry in the source section is a row or column (depending on your layout) that describes a state the system can be in.
- **Actions section** -- Represents the state changes or operations. Each entry describes an action that can be applied to a source state.

The layout is flexible: you can place the source section on the rows and actions on the columns, or vice versa. This is entirely up to you and depends on what reads most naturally for your domain.

### The Matrix

The intersection of a source row and an action column (or vice versa) forms a cell. If that cell contains a value, it becomes a test case. If the cell is empty, no test case is generated for that combination.

### Example Layout

```
                     Action 1         Action 2         Action 3
                  +-----------+----+-----------+----+-----------+----+
                  | Name      |... | Name      |... | Name      |... |
                  | Generator |    | Generator |    | Generator |    |
+---------+------+-----------+----+-----------+----+-----------+----+
| Source 1 | gen:...| value     |    | value     |    |           |    |
+---------+------+-----------+----+-----------+----+-----------+----+
| Source 2 | gen:...|           |    | value     |    | value     |    |
+---------+------+-----------+----+-----------+----+-----------+----+
| Source 3 | gen:...| value     |    |           |    | value     |    |
+---------+------+-----------+----+-----------+----+-----------+----+
```

In this example:

- The combination of Source 1 and Action 1 is a test case (cell has a value).
- The combination of Source 1 and Action 3 is not a test case (cell is empty).
- The combination of Source 2 and Action 2 is a test case.

## Test Case Identity

Each test case in a matrix table is identified by its row and column position using the format:

```
r<rowNumber>:c<columnNumber>
```

For example, a test case at row 2, column 3 would have the name `r2:c3`. This is represented by the `TestcaseDefinitionMatrix` class.

## Directive Creation

When a matrix test case is processed, the `TestcaseProcessor` calls `createDirectives()` on the `TestcaseDefinitionMatrix`. The method inspects the generator strings from both the row meta and the column meta and creates the appropriate directives:

- If the generator string starts with `gen:`, a `GeneratorDirective` is created.
- If it starts with `ref:`, a `ReferenceDirective` is created.
- Otherwise, a `StaticDirective` is created with the value as-is.

Both the row and the column contribute directives, so each matrix test case typically produces two directives -- one from the source and one from the action.

## Execution Control

A matrix test case is considered executable when:

1. The cell at the row/column intersection has a value (is not empty).
2. Either the row meta or the column meta has `execute` set to true.

If both conditions are met, the test case is included in the generation run. Otherwise, it is skipped.

## Practical Use Cases

Matrix tables are well suited for:

- **State machine testing** -- Rows represent current states, columns represent events/transitions, and cells indicate which transitions are valid.
- **CRUD operations** -- Rows represent entity types or existing records, columns represent create/read/update/delete operations.
- **Permission matrices** -- Rows represent roles, columns represent actions, and cells indicate whether the action is allowed for the role.
- **Workflow transitions** -- Rows represent workflow stages, columns represent possible next stages.

## Complete Example

Below is a conceptual example of a matrix table for testing account status transitions:

```
     A                    B             C            D            E
+--------------------+-----------+------------+------------+------------+
| <MATRIX_TABLE>     |           |            |            |            |
+--------------------+-----------+------------+------------+------------+
|                    |           | Activate   | Suspend    | Close      |
|                    |           | gen:1:...  | gen:2:...  | gen:3:...  |
|                    |           | true       | true       | true       |
+--------------------+-----------+------------+------------+------------+
| New Account        | gen:4:... | activate   |            |            |
+--------------------+-----------+------------+------------+------------+
| Active Account     | gen:5:... |            | suspend    | close      |
+--------------------+-----------+------------+------------+------------+
| Suspended Account  | gen:6:... | reactivate |            | close      |
+--------------------+-----------+------------+------------+------------+
| <END>              |           |            |            |            |
+--------------------+-----------+------------+------------+------------+
```

This generates four test cases:

- `r0:c0` -- New Account + Activate
- `r1:c1` -- Active Account + Suspend
- `r1:c2` -- Active Account + Close
- `r2:c0` -- Suspended Account + Activate (reactivate)
- `r2:c2` -- Suspended Account + Close

Empty cells (e.g., New Account + Suspend) are not generated because those transitions are not valid in the domain.
