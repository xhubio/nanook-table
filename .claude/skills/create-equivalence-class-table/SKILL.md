---
name: create-equivalence-class-table
description: >
  Creates formatted Excel files with Nanook Decision Tables for any test object
  (pages, APIs, forms). Includes color formatting, formulas, correct marker logic,
  CASCADE pattern, and 100% coverage.
  Trigger: "create equivalence class table", "decision table", "equivalence class table",
  "test data table", "nanook table"
version: 0.1.0
---

# Create Nanook Decision Table

Creates formatted Excel files with Nanook Decision Tables for any test object
(pages, APIs, forms). Includes color formatting, formulas, correct marker logic, and 100% coverage.

## Technology
- **exceljs** (not xlsx) — required for cell styling (fills, fonts) and formulas
- Nanook's `ImporterXlsx` reads the generated file — therefore the structure must exactly match the ParserDecision format

## General Workflow: From Test Object to Decision Table

### Step 1: Analyze the Test Object
- What fields does the page/form/API have?
- Which fields are required, which are optional?
- What validation rules apply? (min/max, format, dependencies)
- Are there logical field groups? (address, date, line items)

### Step 2: Form Field Groups → Table Structure
- **< 6 fields**: A single table is sufficient
- **6-8 fields**: Check whether splitting makes sense
- **> 8 fields**: Split into sub-tables (see Multi-Sheet Strategy)
- Orient around the test object: UI tabs, API objects, business domains

### Step 3: Define EqClasses per Field
- For each field: What equivalence classes exist? (see patterns below)
- At least 2 EqClasses per field (valid + at least 1 invalid/variant)
- Choose descriptive names: "valid", "empty", "tooLong", "negative"

### Step 4: Plan Test Cases
- 1 happy-path TC (all fields valid)
- 1 error TC per non-preferred EqClass (for 100% CASCADE)
- Optional: Additional valid variants (e.g., optional fields empty)
- TC order: **Error TCs first, valid TCs last** (more readable CASCADE)

### Step 5: Pre-calculate Coverage
```
total = product of all EqClass counts
Required TCs for 100% CASCADE = (sum of all non-preferred EqClasses) + 1 happy
```

### Step 6: Generate and Verify Excel
- Run script → generate Excel
- Open in spreadsheet → check colors, formulas, markers
- Run Nanook generate → check fixtures

## Column Layout (ParserDecision)

| Column | Content |
|--------|---------|
| A (1) | Name / Field name |
| B (2) | Section type (FieldSection, FieldSubSection, ExecuteSection, ...) |
| C (3) | Equivalence class name / count (for FieldSubSection header) |
| D (4) | Generator / TDG |
| E (5) | Comment |
| F+ (6+) | Test case columns |

## Row Order in Excel

```
<DECISION_TABLE>     ← Header with TC names in column F+
Execute              ← ExecuteSection: T/F per TC
NeverExecute         ← NeverExecuteSection: T/F (optional)
Multiply             ← MultiplicitySection: 1 per TC
FieldSection         ← Group header (e.g., "Billing Address")
  FieldSubSection    ← Field header (e.g., "billingName"), C=COUNTA formula
    EqClass rows     ← Equivalence classes with markers
  FieldSubSection    ← next field
    ...
GeneratorSwitch      ← GeneratorSwitchSection (optional)
Filter               ← FilterSection (optional)
Summary              ← SummarySection with coverage formulas
Expected Result      ← MultiRowSection
Tags                 ← TagSection
<END>
```

## All Section Types (10 total)

### Always Used
| Section | Type | Rows | Description |
|---------|------|------|-------------|
| FieldSection | Multi-Row | 1+ FSS | Groups fields (e.g., "Billing Address") |
| FieldSubSection | Multi-Row | 1+ EqClass | A field with its equivalence classes |
| ExecuteSection | Single-Row | 1 | T=generate, F=only usable by reference |
| MultiplicitySection | Single-Row | 1 | How many times to generate TC (default: 1) |
| SummarySection | Single-Row | 1 | Coverage calculation (max 1 per table) |
| MultiRowSection | Multi-Row | 1+ | Expected results, error messages, actions |
| TagSection | Multi-Row | 1+ | Labels/tags for TCs (happy-path, smoke, etc.) |

### Optional / Advanced
| Section | Type | Description |
|---------|------|-------------|
| NeverExecuteSection | Single-Row | Opposite of ExecuteSection: T=don't generate when referenced |
| FilterSection | Multi-Row | Filter expressions for conditional TC inclusion. Only on master TCs, not on referenced ones |
| GeneratorSwitchSection | Multi-Row | Disable specific generators per TC |

### ExecuteSection Values
- **True**: `x`, `1`, `y`, `j`, `yes`, `ja`, `si`, `true`, `ok`, `T` (case-insensitive)
- **False**: `F` or any other value
- **WARNING**: 'x' is recognized as TRUE! For sub-tables always use 'F'

## Marker System

### Marker Types
| Marker | Meaning | COUNTA | Data Generation |
|--------|---------|--------|-----------------|
| `x` | Selected (single value) | Yes | Will be used |
| `a` | Preferred (when multiple) | Yes | Will be preferentially chosen |
| `e` | Fallback (when multiple) | Yes | Only if no `a` present |
| `i` | Impossible (logically impossible) | Yes | Will NOT be used |
| empty | Not marked | No | Will not be used |

### Marker Rules by Test Case Type

**1. Target field (the field this TC tests):**
- Mark ONLY the target EqClass with `x`
- Leave all other EqClasses empty
- COUNTA = 1

**2. Happy-path TC, non-target field:**
- Mark ONLY the valid EqClass with `x`
- No `e` on invalid values (logically wrong: "all valid" cannot cover "Invalid > 100%")
- COUNTA = 1

**3. Error TC, non-target field:**
- Mark valid EqClass with `a` (will be preferentially chosen)
- Mark all other EqClasses with `e` (count for coverage)
- COUNTA = number of EqClasses → increased coverage
- Reason: In error TCs it doesn't matter what's in non-target fields, we're testing the error

**4. Impossible (`i`):**
- For logically impossible combinations (e.g., UI hides field)
- Counts for COUNTA/coverage but is not generated
- Used to bring the table to 100% coverage

### Rule: Single Marker = always `x`
If only ONE EqClass is marked for a field in a TC, `x` must be used (not `a`).

## Formulas (all values as Excel formulas, no static numbers)

### FieldSubSection Header (Column C)
```
=COUNTA(C_eqStart:C_eqEnd)
```
Counts the EqClass names → yields number of equivalence classes.

### FieldSubSection Header (TC columns)
```
=COUNTA(F_eqStart:F_eqEnd)
```
Counts the markers per TC → yields how many EqClasses this TC covers.

### Summary (Column C) — Total Combinations
```
=C_fss1 * C_fss2 * C_fss3 * ...
```
Product of all FieldSubSection C values = total number of possible combinations.

### Summary (TC columns) — Per-TC Coverage
```
=F_fss1 * F_fss2 * F_fss3 * ...
```
Product of all FieldSubSection COUNTA values for this TC.

### Summary (Column E) — Sum of All TC Coverages
```
=SUM(F_summary:lastTC_summary)
```

### Summary (Column D) — Percentage
```
=E_summary / C_summary
```
Format: `0.00%`

## Color Formatting

| Row Type | Background | Font |
|----------|------------|------|
| `<DECISION_TABLE>` Header | Dark blue #0070C0 | White, Bold |
| ExecuteSection | Blue #4472C4 | White |
| MultiplicitySection | Blue #4472C4 | White |
| FieldSection Header | Blue #4472C4 | White |
| FieldSubSection Header | Blue #4472C4 | White |
| EqClass data rows | No fill | Default |
| SummarySection | Green #00B050 | White, Bold |
| MultiRowSection Header | Green #00B050 | Blue |
| MultiRowSection Data | No fill | Default |
| TagSection Header | Blue #4472C4 | White |
| TagSection Data | No fill | Default |
| `<END>` | Blue #4472C4 | White |

## TC Column Formatting
- Horizontal: center
- Vertical: middle
- Width: 5

## Column Widths
- A (Name): 25
- B (Type): 20
- C (EqClass): 30
- D (Generator): 15 (or 35 if no Percent in D)
- E (Comment): 30

## EqClass Patterns for Common Field Types

### Required Text Field (e.g., name, street)
| EqClass | Generator | Comment |
|---------|-----------|---------|
| valid | `gen:N:faker:person.fullName` | Valid value |
| empty | `` | Required field empty |
| whitespace | `   ` | Whitespace only |
| tooLong | `gen:N:faker:string.alpha(300)` | Exceeds max length |

### Optional Text Field (e.g., notes, comment)
| EqClass | Generator | Comment |
|---------|-----------|---------|
| valid | `gen:N:faker:lorem.paragraph` | Valid value |
| empty | `` | Optional empty (valid!) |

### Email Field
| EqClass | Generator | Comment |
|---------|-----------|---------|
| valid | `gen:N:faker:internet.email` | Valid email |
| invalid | `not-an-email` | Wrong format |
| empty | `` | Empty (required=error, optional=valid) |

### Numeric Field (e.g., quantity, price)
| EqClass | Generator | Comment |
|---------|-----------|---------|
| valid | `100` | Valid value |
| zero | `0` | Zero value (valid/invalid depending on context) |
| negative | `-1` | Negative value |
| tooHigh | `999999` | Exceeds maximum |

### Date Field
| EqClass | Generator | Comment |
|---------|-----------|---------|
| valid | `2026-03-01` | Valid date |
| empty | `` | No date |
| past | `2020-01-01` | Date in the past |
| future | `2030-12-31` | Date in the future |

### Select/Dropdown (e.g., country, type)
| EqClass | Generator | Comment |
|---------|-----------|---------|
| valid | `DE` | Valid value |
| invalid | `INVALID` | Not in the list |
| empty | `` | No selection |

### Boolean/Checkbox
| EqClass | Generator | Comment |
|---------|-----------|---------|
| true | `true` | Checked |
| false | `false` | Unchecked |

### Notes on EqClasses
- Not every field needs all variants — only the **functionally relevant** ones
- Fewer EqClasses = smaller combination space = easier to reach 100%
- `i` (impossible) for logically impossible combinations (e.g., UI hides field)
- For dependencies between fields: Check whether references/self-refs are needed

## Data in Cells: Static, Generator, Reference

### Static Data
Any value that does NOT start with `gen:` or `ref:` is used directly as test data.
```
DE              ← Used as string "DE"
100             ← Used as string "100"
not-an-email    ← Used as string
```

### Generator Syntax
```
gen:<instanceId>:<generatorName>:<parameter>
```
| Part | Description |
|------|-------------|
| instanceId | Groups related generations. Same ID = same data |
| generatorName | Name of the registered generator (e.g., "faker") |
| parameter | Generator-specific (e.g., Faker function) |

**Instance ID Reuse** — Related fields:
```
gen:1:faker:person.fullName    ← Person 1
gen:1:faker:internet.email     ← Email of Person 1 (same instance!)
gen:2:faker:person.fullName    ← Person 2 (different instance)
```

**Common Faker Functions:**
```
person.fullName, person.firstName, person.lastName
internet.email, internet.url
location.street, location.city, location.zipCode, location.country
lorem.paragraph, lorem.sentence, lorem.word
commerce.productName, commerce.price
string.alpha(N), string.numeric(N), string.uuid
date.recent, date.future, date.past
phone.number
```

### Self-References
References another field in the same test case:
```
ref:::fieldName:    ← Value of "fieldName" in the same TC
```
Useful when a field depends on the value of another field.

## Test Case Definition

Each test case needs:
1. **Name** (in the header)
2. **Type**: Happy-path or error TC (determines marker logic)
3. **Target field(s)**: Which field(s) does this TC test
4. **Target EqClass**: Which EqClass is selected in the target field
5. **Expected Result**: Result in the MultiRowSection
6. **Tags**: Categorization in the TagSection

## Data Structure for Field Definitions

```typescript
interface EqClass {
  name: string          // EqClass name (e.g., "valid", "empty")
  generator: string     // Generator/value (e.g., "gen:1:faker:person.fullName")
  comment: string       // Description
  targetTcs: string[]   // Which TCs select this EqClass as target
  preferred: boolean    // Is this the valid/preferred value?
}

interface FieldDef {
  name: string          // Field name
  eqClasses: EqClass[]  // Equivalence classes
  targetTcs: string[]   // Which TCs test this field
}

interface SectionDef {
  name: string          // Section name (e.g., "Billing Address")
  fields: FieldDef[]    // Fields in this section
}
```

## Verification After Creation

1. `npx tsx scripts/create-<name>-table.ts` — generate Excel
2. Open Excel in LibreOffice/Numbers — check colors, formulas, markers
3. `npx tsx scripts/generate-<name>-fixtures.ts` — Nanook parses and generates
4. Check: Correct number of fixtures, data correct

## References Between Tables (Nanook's Core Feature)

### Concept
A main table can reference sub-tables. The reference is placed as a **generator value** in an EqClass row (column D).

### Reference Syntax
```
ref:InstanceId:TableName:FieldName:TestcaseName
```

**WARNING:** FieldName comes BEFORE TestcaseName! (Code: `parts[3]=targetFieldName, parts[4]=targetTestcaseName`)

| Part | Required | Description |
|------|----------|-------------|
| `ref` | Yes | Keyword (parts[0]) |
| InstanceId | No | Groups related references (parts[1]) |
| TableName | No | Target table, empty = same table (parts[2]) |
| FieldName | No | Specific field, empty = no data value (parts[3]) |
| TestcaseName | Yes | Target test case (parts[4]) |

### Examples
```
ref:1:BillingAddress:billingName:validAddress   ← Field billingName from validAddress in BillingAddress
ref:1:BillingAddress:street:validAddress        ← Same instance, different field
ref:1:BillingAddress::validAddress              ← Without FieldName (only create instance)
ref:::password:                                  ← Self-reference (same table)
```

### Range References
```
ref::TableName::[tc_prefix_1-N]
```
- Square brackets `[prefix_1-N]` reference multiple TCs (prefix_1, prefix_2, ..., prefix_N)
- InstanceId MUST be empty for ranges (code checks this and logs error)
- Creates a copy of the calling TC per referenced TC
- **Cartesian product**: Multiple range references in a TC multiply!

#### Range Parsing (Code: `processRanges`)
```
[invalid_1-7]   → invalid_1, invalid_2, ..., invalid_7
[valid_1-2]     → valid_1, valid_2
[T3-4]          → T3, T4
[a1-3,b1-2]     → a1, a2, a3, b1, b2  (comma-separated ranges)
```
Regex: `/(\D*)(\d+)-(\d+)$/` — Non-digit prefix + start number + end number

### Valid/Invalid Strategy with Ranges

Name sub-table TCs following the pattern `valid_N` and `invalid_N`.
The main table then only has 2 EqClasses per reference field:

```
billingScenario (FieldSubSection)
  valid      | ref::BillingAddress::valid_1           | Single ref (1 fixture)
  invalid    | ref::BillingAddress::[invalid_1-7]     | Range ref (7 fixtures)
```

**Why "valid" as single ref, "invalid" as range:**
- Error TCs need each error variant → range expands automatically
- Non-target fields always reference valid_1 → no unnecessary multiplication
- Result: billingInvalid → 7 fixtures, datesInvalid → 4 fixtures, etc.
- Cartesian product stays small: 1 × 1 × 9 = 9 (not 2 × 4 × 9 = 72)

**Naming Convention for Sub-Tables:**
```
invalid_1  ← First error case (error-first!)
invalid_2  ← Second error case
...
invalid_N  ← Last error case
valid_1    ← Standard happy path (all fields valid)
valid_2    ← Variant (e.g., minimal required fields)
```

### Multi-Sheet Architecture
```
<name>-tests.xlsx
├── Sheet "MainTable"        ← Main table (execute=T), CASCADE, 100%
│   subTableAScenario         ← valid (single-ref) + invalid (range-ref)
│   subTableBScenario         ← valid (single-ref) + invalid (range-ref)
│   directField1, field2      ← Direct fields (valid/empty)
├── Sheet "SubTableA"        ← Sub-table (execute=F), CASCADE, 100%
├── Sheet "SubTableB"        ← Sub-table (execute=F), CASCADE, 100%
└── ...
```

### Important Reference Rules
- **ExecuteSection='F'** for sub-tables: TCs are only executed by reference, no own fixtures
- **Filters** in referenced TCs are NOT executed (only in master TC)
- **Tags** from referenced TCs are collected
- **NeverExecuteSection**: Prevents referencing by other TCs (opposite of ExecuteSection=F!)
- **Table names** must be unique across all loaded spreadsheets
- Each reference resolution creates a new instance of the referenced TC

### Splitting Tables (Multi-Sheet Strategy)

#### When to Split?
- Table has more than 6-8 fields → combinations explode (e.g., 18 fields = 25M combinations)
- Field groups belong logically together (address, date, line items)
- Different main scenarios need different sub-tables
- Coverage below ~80% despite correct markers → table is too large

#### Splitting Follows the Test Object
The table structure mirrors the test object — not the other way around:
- **UI form**: Each logical form section (tab, accordion, wizard step) can become a sheet
- **API endpoint**: Request body structure determines the split (nested objects → sub-sheets)
- **Business domain**: Bounded contexts / aggregate boundaries as natural cut lines
- **Reuse**: Same sub-table (e.g., address) can be referenced from different main tables

#### Procedure

**1. Identify field groups:**
Group fields that belong together functionally.

**2. Each group becomes its own sheet:**
- Its own `<DECISION_TABLE>` header
- Its own test cases (happy path + error cases for this group)
- Its own coverage calculation → target 100% per sub-table
- Small combination count → easy to reach 100%

**3. Main table references sub-sheets:**
- For each field group a FieldSubSection with reference EqClasses
- Each EqClass points to a TC in the sub-table

**4. Example main table (valid/invalid with ranges):**
```
<DECISION_TABLE>              | billingInvalid | datesInvalid | validAll
FieldSection "Billing"
  billingScenario (FSS)       | COUNTA
    valid                     | ref::SubA::valid_1           |   | x  | x
    invalid                   | ref::SubA::[invalid_1-7]     | x | e  |
FieldSection "Dates"
  dateScenario (FSS)          | COUNTA
    valid                     | ref::SubB::valid_1            | a | x  | x
    invalid                   | ref::SubB::[invalid_1-4]      | e |    |
```

## CASCADE Pattern for 100% Coverage

### Concept
With the CASCADE technique, `a`/`e` markers are only placed on fields that come **after** the target field in the field order. Fields **before** the target field get only `x` on the preferred value (like in happy path).

### Why Does CASCADE Work?
Each TC covers less than the previous one. The products form a decreasing series:
```
TC1 (Field 1):   1 × 2 × 2 × 2 × 2 = 16  (a/e on fields 2-5)
TC2 (Field 2):   1 × 1 × 2 × 2 × 2 =  8  (a/e on fields 3-5)
TC3 (Field 3):   1 × 1 × 1 × 2 × 2 =  4  (a/e on fields 4-5)
TC4 (Field 4):   1 × 1 × 1 × 1 × 2 =  2  (a/e on field 5)
TC5 (Field 5):   1 × 1 × 1 × 1 × 1 =  1  (no field after)
TC6 (Happy):    1 × 1 × 1 × 1 × 1 =  1
                                      ──
Sum:                                32 = 2^5 = total
```

### Prerequisite for Exactly 100%
**Each non-preferred EqClass needs its own error TC.**
Then the sum of products equals exactly the total.

**Special case: All fields have 2 EqClasses:**
```
total = 2^n   (n = number of fields)
sum = 2^(n-1) + 2^(n-2) + ... + 2^0 + 1 = 2^n
```

**General: Fields with different EqClass counts (e.g., 3, 2, 2, 2, 3, 3):**
Works too! Each non-preferred EqClass yields a TC with product:
```
product(TC) = 1^(fields before) × product(EqClass counts of fields after)
```
All products + happy path(1) = total.

**Example BillingAddress (3×2×2×2×3×3 = 216):**
```
billingName:   empty(72) + whitespace(72)          = 144
street:        empty(36)                           =  36
postalCode:    empty(18)                           =  18
city:          empty(9)                            =   9
country:       invalid_3chars(3) + empty(3)        =   6
customerEmail: invalid(1) + empty(1)               =   2
happy:                                             =   1
                                             Sum:   216 = 100%
```

### Implementation
Each non-happy TC needs a **target field** (the field it tests). The fields must have a fixed order.

**Marker logic per TC:**
1. **Happy-path TC**: All fields `x` on preferred → product = 1
2. **Error/target TC**:
   - Target field: `x` on target EqClass → COUNTA = 1
   - Fields BEFORE target field: `x` on preferred → COUNTA = 1
   - Fields AFTER target field: `a` on preferred, `e` on rest → COUNTA = n

### When to Use CASCADE?
- Main tables with reference fields (valid/invalid per ref → 2 EqClasses)
- Sub-tables with any number of EqClasses per field
- When the coverage sum should hit the total exactly (100%)

### When NOT CASCADE?
- When fields logically belong together and must always be marked together
- When >100% coverage is intentionally desired (maximum coverage)

### TC Order: Error-First
More readable for humans: **Error TCs first, valid TCs last.**
The CASCADE staircase pattern (a/e markers from left to right) becomes immediately visible.
```
                    | inv_1 | inv_2 | inv_3 | inv_4 | valid_1
field1 valid        |       |   x   |   x   |   x   |   x
       empty        |   x   |       |       |       |
field2 valid        |   a   |       |   x   |   x   |   x
       empty        |   e   |   x   |       |       |
field3 valid        |   a   |   a   |       |   x   |   x
       empty        |   e   |   e   |   x   |       |
field4 valid        |   a   |   a   |   a   |       |   x
       empty        |   e   |   e   |   e   |   x   |
```
The a/e markers form a triangle — immediately visible whether the pattern is correct.

## Important Notes

- `exceljs` is 1-based (column 1 = A, row 1 = first row)
- Write formulas with `{ formula: '...' }`, NOT as string
- Percentage cell needs `numFmt: '0.00%'`
- Call `row.commit()` after changes
- Styling is applied AFTER writing data (otherwise commit() overwrites the style)
- Nanook's ImporterXlsx reads the Excel file — formulas don't need to be calculated, but the structure must be correct
- Reference example script: `saas-coding-kernel/repo/tools/playwright-test-definition/scripts/create-invoice-table.ts`
