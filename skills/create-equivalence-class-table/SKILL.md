---
name: create-equivalence-class-table
description: >
  nanook.xhub: Draft a new decision table (equivalence classes, test cases, CASCADE coverage)
  as a formatted XLSX for a form, page or API, check its coverage and generate test
  data from it with @xhubio/nanook-table. Use when asked to create or extend an equivalence
  class table, a decision table or a test case table for a form or API with Nanook.
  For a table that already exists and only needs test data, fixtures or data-driven tests,
  use generate-test-data instead. Also: "equivalence class table", "decision table",
  "test data table", "nanook table".
license: MIT
metadata:
  version: "0.4.2"
---

# nanook.xhub: Create a decision table

Creates formatted Excel files with nanook.xhub decision tables for any test object
(pages, APIs, forms). Includes colour formatting, formulas, correct marker logic and 100% coverage.

## Technology
- **exceljs** (not xlsx) — needed for cell styling (fills, fonts) and formulas
- Nanook's `ImporterXlsx` reads the generated file — so the structure must match the ParserDecision format exactly

## Environment and bundled scripts

- Project with `@xhubio/nanook-table` (3.1.0 or later, ESM; 3.0.1 works, but without the scripts in the package) and `exceljs` as a devDependency
  (`npm install -D exceljs`) — `exceljs` is **not** a dependency of Nanook.
- Node.js 22.18 or later runs `.ts`/`.mts` directly; older 22.x need
  `--experimental-strip-types`, `npx tsx` works everywhere.
- Default locations: `scripts/create-<name>-table.ts`, `resources/<name>-tests.xlsx`,
  `fixtures/<name>/`. If the user names other folders, use theirs.
- **Output language**: write comments, error messages and expected results in the language of
  the user's request, not in the language of these instructions.

Two finished, tested scripts are in the `scripts/` folder next to this `SKILL.md` — and,
from `@xhubio/nanook-table` 3.1.0, in the project under
`node_modules/@xhubio/nanook-table/skills/create-equivalence-class-table/scripts/`.
**Copy them from there**: that folder is inside the project, the plugin folder is often outside it and
then not readable. Run them only inside the project: Node resolves imports relative to the script and
does not strip TypeScript types under `node_modules`. If `cp` is not allowed, read the file
and write it into the project **unchanged**. **Never rewrite them**: the scripts are
tested, a rewrite is not. If neither source can be found, tell the user
so instead of building a substitute.

```
cp node_modules/@xhubio/nanook-table/skills/create-equivalence-class-table/scripts/*.mts scripts/
node scripts/check-classes.mts resources/<name>-tests.xlsx
node scripts/generate-fixtures.mts resources/<name>-tests.xlsx fixtures/<name>
```

| Script | What it does | Exit 1 if |
|---|---|---|
| `check-classes.mts` | reads the markers from the cells (not the formula values), recomputes combinations, column products and coverage, reports every class without its own `x` | coverage < 100 %, class without `x`, field without marker, no decision table |
| `generate-fixtures.mts` | Nanook reads the workbook, generators `faker` and `text` and the filter processors `SimpleArrayFilter` and `SimpleArrayIgnoreFilter` are registered, one JSON per test case, count per table | Nanook logged errors (Nanook does not throw, it logs and carries on) |

The `text` generator (in `generate-fixtures.mts`) provides the edge cases `faker` cannot:
`gen::text:empty` (empty string), `gen::text:spaces:N`, `gen::text:alpha:N`,
`gen::text:email:N` (N letters + `@example.com`).

## General workflow: from test object to decision table

### Step 1: Analyse the test object
- Which fields does the page/form/API have?
- Which fields are required, which optional?
- Which validation rules apply? (min/max, format, dependencies)
- Are there logical field groups? (address, date, line items)

### Step 2: Form field groups → table structure
- **< 6 fields**: a single table is enough
- **6-8 fields**: check whether splitting makes sense
- **> 8 fields**: split into sub-tables (see multi-sheet strategy)
- Follow the test object: UI tabs, API objects, business domains

### Step 3: Define EqClasses per field
- For each field: which equivalence classes exist? (see patterns below)
- At least 2 EqClasses per field (valid + at least 1 invalid/variant)
- Choose descriptive names: "valid", "empty", "tooLong", "negative"

### Step 4: Plan test cases
- 1 happy-path TC (all fields valid)
- 1 error TC per non-preferred EqClass (for 100% CASCADE)
- Optional: further valid variants (e.g. optional fields empty)
- TC order: **error TCs first, valid TCs last** (more readable CASCADE)

### Step 5: Precompute coverage
```
total = product of all EqClass counts
TCs needed for 100% CASCADE = (sum of all non-preferred EqClasses) + 1 happy
```

### Step 6: Generate and verify the Excel file
- Run the script → generate the Excel file
- Open it in a spreadsheet → check colours, formulas, markers
- Run Nanook generate → check the fixtures
- Own generators, a run with fewer test cases than expected, using the fixtures in Vitest or
  Playwright: the `generate-test-data` skill covers that part

## Column layout (ParserDecision)

| Column | Content |
|--------|--------|
| A (1) | Name / field name |
| B (2) | Section type (FieldSection, FieldSubSection, ExecuteSection, ...) |
| C (3) | Equivalence class name / count (in FieldSubSection header) |
| D (4) | Generator / TDG |
| E (5) | Comment |
| F+ (6+) | Test case columns |

## Row order in the Excel file

```
<DECISION_TABLE>     ← header with TC names in column F+
Execute              ← ExecuteSection: T/F per TC
NeverExecute         ← NeverExecuteSection: T/F (optional)
Multiply             ← MultiplicitySection: 1 per TC
FieldSection         ← group header (e.g. "Billing Address")
  FieldSubSection    ← field header (e.g. "billingName"), C=COUNTA formula
    EqClass rows     ← equivalence classes with markers
  FieldSubSection    ← next field
    ...
GeneratorSwitch      ← GeneratorSwitchSection (optional)
Filter               ← FilterSection (optional)
Summary              ← SummarySection with coverage formulas
Expected Result      ← MultiRowSection (error codes as rows, see below)
Category             ← TagSection with "negative"/"valid" rows
<END>
```

## All section types (10 total)

### Always used
| Section | Type | Rows | Description |
|---------|-----|--------|-------------|
| FieldSection | Multi-Row | 1+ FSS | Groups fields (e.g. "Billing Address") |
| FieldSubSection | Multi-Row | 1+ EqClass | One field with its equivalence classes |
| ExecuteSection | Single-Row | 1 | T=generate, F=usable only via reference |
| MultiplicitySection | Single-Row | 1 | How often to generate the TC (default: 1) |
| SummarySection | Single-Row | 1 | Coverage calculation (max. 1 per table) |
| MultiRowSection | Multi-Row | 1+ | Expected results, error messages, actions |
| TagSection | Multi-Row | 1+ | Labels/tags for TCs (happy-path, smoke, etc.) |

### Optional / advanced
| Section | Type | Description |
|---------|-----|-------------|
| NeverExecuteSection | Single-Row | Opposite of ExecuteSection: T=do not generate when referenced |
| FilterSection | Multi-Row | Filter expressions for conditional TC inclusion. Only on master TCs, not on referenced ones |
| GeneratorSwitchSection | Multi-Row | Switch off specific generators per TC |

### ExecuteSection values
- **True**: `T`, `1`, `y`, `j`, `yes`, `ja`, `si`, `true`, `ok` (case-insensitive)
- **False**: `F` or any other value
- **CAUTION**: `x` is recognised as FALSE! Write `T` for tables that generate, `F` for sub-tables

## Marker system

### Marker types
| Marker | Meaning | COUNTA | Data generation |
|--------|-----------|--------|------------------|
| `x` | Selected (only value) | Yes | Is used |
| `a` | Preferred (among several) | Yes | Is chosen preferentially |
| `e` | Fallback (among several) | Yes | Only if there is no `a` |
| `i` | Impossible (logically impossible) | Yes | Is NOT used |
| empty | Not marked | No | Is not used |

### Why error TCs put `a` on the VALID class

The obvious reading is "doesn't matter, something already goes wrong above". It is
the wrong way round. The reason is sharper:

> **The other fields get `a` on the valid class so that the
> EXPECTED error message becomes visible and is not masked by another.**

If arbitrary values stood there, another field's error might come
first — the test would be red and still not check what it claims.

Example: a test case expects rejection **at the field** because of a password that is
too long, but `Password too long` comes **from the server** — both messages are
true, but the second belongs to a different boundary and masks the first.

### `e` in the valid case means "I don't care what's in it" — and that is allowed

If a page has properties that are **irrelevant** to
the object under test, all their **valid** classes go on `e` in the valid case.
That satisfies coverage, and at the same time the table states
something true:

> **Not "I have tested all combinations", but "here I have
> explicitly declared that I don't care."**

🔵 That is the real gain: the indifference is **written down**.
If the property later becomes meaningful — a field moves into a PDF, an
export, an invoice — the row shows immediately where you
did without it, and you give it its own column. A table without these markers
hides the decision; later nobody knows whether someone tested or
forgot.

🔴 **Never on an error class.** "I don't care" applies to permitted values. An
`e` on an error class claims an invalid value still leads to the
good result.

**Two constraints**, so that it does not go wrong:

| | |
|---|---|
| **The preferred class needs its `x` elsewhere** | If you open up the happy path itself, it loses it — for a field at the very end, no test case is then left at all. `check-classes.mts` reports this |
| **`e` produces NO variation** | `e` means "only if there is no `a`" — with an `a` in the field, the `a` wins every time. Anyone who really wants to vary needs a field **without** `a`; whether the library then switches per run is untested |

⚪ And if it does: a test that takes different data on every run no longer reproduces
a failure. Variation is a trade-off of its own, not a side effect
of coverage.

### 🔴 100 % is ALWAYS reachable — the cascade just isn't always the way there

The telescoping identity `Σ_i (n_i − 1)·Π_{j>i} n_j = C − 1` assumes that
**every** class except the preferred one is an error target. Only an error column
may open its successors on **all** classes — it may do so because something
already goes wrong above.

As soon as a field has a **valid alternative** (`logo: none|png|svg`,
`measurementSystem: metric|imperial`), the arithmetic breaks: a valid-case column
may only open the valid classes, never the faulty ones — otherwise it would claim
that an invalid value leads to the good result. Its contribution is therefore
smaller than the full product, and the sum stays below 100 %.

🔴 **This does NOT mean 100 % is unreachable.** What fails is
the **shortcut**, not the goal. Coverage remains reachable, you just pay for it
with **columns** instead of an identity:

| Way | Cost |
|---|---|
| Cascade | (n−1) columns per field — cheap, but only if every alternative is an error target |
| Field order | Fields with valid alternatives go to the BACK; if such a field is last, Π of the successors = 1 and the valid-case column counts in full again |
| Enumerate | the missing combinations as their own columns — in the limit one per combination. Always possible, sometimes a lot of work |

⚪ A table below 100 % is then a **decision about effort**, not a
limit of the method — and it should be made deliberately, not by accident.

> 💡 **As long as you are not enumerating, the better question is not "what
> percentage", but "does every class have its own test case".** That is what
> `check-classes.mts` is for — it counts only `x`, because `a`/`e` are a choice and not a
> guarantee.

### Marker rules by test case type

**1. Target field (the field this TC tests):**
- Mark ONLY the target EqClass with `x`
- Leave all other EqClasses empty
- COUNTA = 1

**2. Happy-path TC, non-target field:**
- Default: mark ONLY the preferred valid EqClass with `x` (COUNTA = 1)
- Exception: if the field has several **valid** classes and is irrelevant to the object
  under test, all valid classes may get `e` (see "`e` in the valid case")
- Never `a`/`e` on invalid values (logically wrong: "all valid" cannot cover an error value)

**3. Error TC, non-target field:**
- Mark the valid EqClass with `a` (chosen preferentially)
- Mark all other EqClasses with `e` (count towards coverage)
- COUNTA = number of EqClasses → higher coverage
- Reason: in error TCs it does not matter what is in non-target fields, we are testing the error

**4. Impossible (`i`):**
- For logically impossible combinations (e.g. the UI hides the field)
- Counts for COUNTA/coverage but is not generated
- Serves to bring the table to 100% coverage

### Rule: single marker = always `x`
If only ONE EqClass is marked for a field in a TC, `x` must be used (not `a`).

## Formulas (all values as Excel formulas, no static numbers)

### FieldSubSection header (column C)
```
=COUNTA(C_eqStart:C_eqEnd)
```
Counts the EqClass names → gives the number of equivalence classes.

### FieldSubSection header (TC columns)
```
=COUNTA(F_eqStart:F_eqEnd)
```
Counts the markers per TC → gives how many EqClasses this TC covers.

### Summary (column C) — total combinations
```
=C_fss1 * C_fss2 * C_fss3 * ...
```
Product of all FieldSubSection C values = total number of possible combinations.

### Summary (TC columns) — per-TC coverage
```
=F_fss1 * F_fss2 * F_fss3 * ...
```
Product of all FieldSubSection COUNTA values for this TC.

### Summary (column E) — sum of all TC coverages
```
=SUM(F_summary:lastTC_summary)
```

### Summary (column D) — percentage
```
=E_summary / C_summary
```
Format: `0.00%`

## Colour formatting

| Row type | Background | Font |
|---|---|---|
| `<DECISION_TABLE>` header | Dark blue #0070C0 | White, bold |
| ExecuteSection | Blue #4472C4 | White |
| MultiplicitySection | Blue #4472C4 | White |
| FieldSection header | Blue #4472C4 | White |
| FieldSubSection header | Blue #4472C4 | White |
| EqClass data rows | No fill | Default |
| SummarySection | Green #00B050 | White, bold |
| MultiRowSection header | Green #00B050 | Blue |
| MultiRowSection data | No fill | Default |
| TagSection header | Blue #4472C4 | White |
| TagSection data | No fill | Default |
| `<END>` | Blue #4472C4 | White |

## TC column formatting
- Horizontal: center
- Vertical: middle
- Width: 5

## Column widths
- A (Name): 25
- B (Type): 20
- C (EqClass): 30
- D (Generator): 15 (or 35 if there is no percentage in D)
- E (Comment): 30

## EqClass patterns for common field types

🔴 **The built-in `faker` generator takes only a path, no arguments.**
`gen::faker:string.alpha(300)` or `gen:1:faker:string.alpha:255` fail; Nanook logs
the error and drops the test case (fewer cases than columns). So produce lengths, empty values and
spaces via the `text` generator (see above) or a generator of your own.
Empty cells and pure spaces are no good as values: the importer trims cells.

Invalid EqClasses should always have `errorCode` and `errorMessage`. These are shown as
separate rows in the expected-result area (see "Expected Result — error code rows").
Valid variants (e.g. `credit_note` as an alternative type) have no `errorCode`.

### Required text field (e.g. name, street)
| EqClass | Generator | Comment | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `gen:N:faker:person.fullName` | Valid value | — | — |
| empty | `gen::text:empty` | Required field empty | `NAME_EMPTY` | Name is required |
| whitespace | `gen::text:spaces:3` | Spaces only | `NAME_WHITESPACE` | Name must not be only spaces |
| tooLong | `gen::text:alpha:300` | Over max. length | `NAME_TOO_LONG` | Name exceeds max. length |

### Optional text field (e.g. notes, comment)
| EqClass | Generator | Comment | errorCode |
|---------|-----------|-----------|-----------|
| valid | `gen:N:faker:lorem.paragraph` | Valid value | — |
| empty | `gen::text:empty` | Optional, empty (valid!) | — (no error!) |

### Email field
| EqClass | Generator | Comment | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `gen:N:faker:internet.email` | Valid email | — | — |
| invalid | `not-an-email` | Wrong format | `EMAIL_FORMAT` | Email has wrong format |
| empty | `gen::text:empty` | Empty (required=error, optional=valid) | `EMAIL_EMPTY` | Email is required |

### Numeric field (e.g. quantity, price)
| EqClass | Generator | Comment | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `100` | Valid value | — | — |
| zero | `0` | Zero value (depending on context) | `QTY_ZERO` | Quantity must not be zero |
| negative | `-1` | Negative value | `QTY_NEGATIVE` | Quantity must not be negative |
| tooHigh | `999999` | Over maximum | `QTY_TOO_HIGH` | Quantity exceeds maximum |

### Date field
| EqClass | Generator | Comment | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `2026-03-01` | Valid date | — | — |
| empty | `gen::text:empty` | No date | `DATE_EMPTY` | Date is required |
| invalid | `not-a-date` | Not a valid date | `DATE_FORMAT` | Date has wrong format |
| past | `2020-01-01` | Date in the past | — (often valid) | — |
| future | `2030-12-31` | Date in the future | — (often valid) | — |

### Select/dropdown (e.g. country, type)
| EqClass | Generator | Comment | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `DE` | Valid value | — | — |
| invalid | `INVALID` | Not in the list | `COUNTRY_INVALID` | Invalid country code |
| empty | `gen::text:empty` | No selection | `COUNTRY_EMPTY` | Country code is required |

### Boolean/checkbox
| EqClass | Generator | Comment | errorCode |
|---------|-----------|-----------|-----------|
| true | `true` | Enabled | — |
| false | `false` | Disabled | — |

### Notes on EqClasses
- Not every field needs all variants — only the **relevant ones for the business**
- Fewer EqClasses = smaller combination space = 100% easier to reach
- `i` (impossible) for logically impossible combinations (e.g. the UI hides the field)
- With dependencies between fields: check whether references/self-refs are needed
- **errorCode** only on EqClasses that trigger an error, NOT on valid variants
- **errorCode** should match the system's actual error code (e.g. API error codes)

## Data in cells: static, generator, reference

### Static data
Any value that does NOT start with `gen:` or `ref:` is taken directly as test data.
```
DE              ← used as the string "DE"
100             ← used as the string "100"
not-an-email    ← used as a string
```

### Generator syntax
```
gen:<instanceId>:<generatorName>:<parameter>
```
| Part | Description |
|------|-------------|
| instanceId | Groups related generations. Same ID = same data |
| generatorName | Name of the registered generator (e.g. "faker") |
| parameter | Generator-specific (e.g. faker function) |

**Instance ID reuse** — related fields:
```
gen:1:faker:person.fullName    ← person 1
gen:1:faker:internet.email     ← email of person 1 (same instance!)
gen:2:faker:person.fullName    ← person 2 (different instance)
```

**Common faker functions** (path only, no arguments):
```
person.fullName, person.firstName, person.lastName
internet.email, internet.url
location.street, location.city, location.zipCode, location.country
lorem.paragraph, lorem.sentence, lorem.word
commerce.productName, commerce.price
string.uuid
date.recent, date.future, date.past
phone.number
```

### Self-references
References another field in the same test case:
```
ref:::fieldName:    ← value of "fieldName" in the same TC
```
Useful when one field depends on the value of another.

🔴 **Version 2.1.3 or later.** If the self-reference is in a table that is itself
referenced from outside (which normally means every data table), the field used to stay
**silently empty** before that — no error message, just a missing value. The cause was two defects:
an unchecked instance during resolution and a target node that got redirected to the collecting
table while the directives were being collected. The symptom that gives it away:
a test case table produces **fewer cases than columns** (in practice: 3 of 7).

## Test case definition

Each test case needs:
1. **Name** (in the header) — sequential (`invalid_1`, `valid_1`) in sub-tables, descriptive in main tables
2. **Type**: happy path or error TC (determines marker logic)
3. **Target field(s)**: which field(s) this TC tests
4. **Target EqClass**: which EqClass is selected in the target field
5. **Expected result**: error code row with `x` marker (or `valid` row)
6. **Category**: `negative` or `valid` row with `x` marker

### TC naming: sequential vs. descriptive

| Table type | Naming | Example | Reason |
|---|---|---|---|
| **Sub-table** (Execute=F) | Sequential | `invalid_1`, `invalid_2`, ..., `valid_1` | Range references `[invalid_1-N]` need consecutive numbers |
| **Main table** (Execute=T) | Descriptive | `format_xrechnung`, `sellerData_invalid` | Not referenced by range, readability matters more |

## Data structure for field definitions

```typescript
interface EqClass {
  name: string          // EqClass name (e.g. "valid", "empty")
  generator: string     // Generator/value (e.g. "gen:1:faker:person.fullName")
  comment: string       // Description
  targetTcs: string[]   // Which TCs choose this EqClass as target
  preferred: boolean    // Is this the valid/preferred value?
  errorCode?: string    // Expected error code if this EqClass triggers an error
  errorMessage?: string // Human-readable error description for the expected-result row
}

interface FieldDef {
  name: string          // Field name
  eqClasses: EqClass[]  // Equivalence classes
  targetTcs: string[]   // Which TCs test this field
}

interface SectionDef {
  name: string          // Section name (e.g. "Billing Address")
  fields: FieldDef[]    // Fields in this section
}
```

## Expected Result — error code rows

Instead of generic "valid"/"error" values, error codes are shown as **separate rows**.
That is more readable, because error codes and error descriptions get more space.

### Structure

```
Expected Result  | MultiRowSection |                        |                                        | TC1 | TC2 | ... | valid_1
                 |                 | valid                  | Data is valid, no error                 |     |     |     |   x
                 |                 | NAME_EMPTY             | Name is required                        |  x  |     |     |
                 |                 | NAME_WHITESPACE        | Name must not be only spaces            |     |  x  |     |
                 |                 | EMAIL_FORMAT           | Email has wrong format                  |     |     |  x  |
                 |                 | valid_variant          | Valid variant, no error                 |     |     |     |
```

### Rules

- **Row `valid`**: `x` on all TCs that expect no error (happy path)
- **Error code rows**: one row per unique `errorCode` from the EqClasses
  - Column C: error code (e.g. `NAME_EMPTY`)
  - Column D: human-readable error description (`errorMessage`)
  - TC columns: `x` on the TC that triggers this error
- **Row `valid_variant`**: `x` on TCs whose target EqClass has no `errorCode`
  (e.g. `credit_note` as an alternative invoice type — valid, but not preferred)
- Error codes are derived from the `errorCode` property of the TC's target EqClass
- A TC has exactly **one** error code row with `x` (or `valid`/`valid_variant`)

## Category TagSection

Instead of a single "category" row with values, `negative` and `valid` are shown as
**separate rows**, each with `x` markers.

### Structure

```
Category         | TagSection      |                        |                                        | TC1 | TC2 | ... | valid_1
                 |                 | negative               |                                        |  x  |  x  |  x  |
                 |                 | valid                  |                                        |     |     |     |   x
```

### Rules

- **Header**: column A = `Category`, column B = `TagSection`
- **Row `negative`**: `x` on all TCs whose target EqClass has an `errorCode`
- **Row `valid`**: `x` on happy-path TCs and TCs without `errorCode` (valid variants)
- A TC gets `x` in exactly one of the two rows

## Verification after creation

1. `node scripts/create-<name>-table.ts` — generate the Excel file
2. `node scripts/check-classes.mts resources/<name>-tests.xlsx` — coverage and own `x` per class
3. `node scripts/generate-fixtures.mts resources/<name>-tests.xlsx fixtures/<name>` — Nanook parses and generates
4. **Check the count**: for each table with `Execute = T`, one case per test case column, plus one for each
   further element of a range reference. Fewer means: a generator failed.
5. Tell the user to open the workbook in a spreadsheet application (colours, formulas, summary row),
   and name the assumptions that did not come from their request (lengths, error codes).
6. For the next steps (generators the table calls that are not registered yet, using the fixtures
   in tests), point to the `generate-test-data` skill.

## References between tables (Nanook's core feature)

### Concept
A main table can refer to sub-tables. The reference is written as a **generator value** in an EqClass row (column D).

### Reference syntax
```
ref:InstanceId:TableName:FieldName:TestcaseName
```

**CAUTION:** FieldName comes BEFORE TestcaseName! (Code: `parts[3]=targetFieldName, parts[4]=targetTestcaseName`)

| Part | Required | Description |
|------|---------|-------------|
| `ref` | Yes | Keyword (parts[0]) |
| InstanceId | No | Groups related references (parts[1]) |
| TableName | No | Target table, empty = same table (parts[2]) |
| FieldName | No | Specific field, empty = no data value (parts[3]) |
| TestcaseName | Yes | Target test case (parts[4]) |

### Examples
```
ref:1:BillingAddress:billingName:validAddress   ← field billingName from validAddress in BillingAddress
ref:1:BillingAddress:street:validAddress        ← same instance, different field
ref:1:BillingAddress::validAddress              ← without FieldName (only create the instance)
ref:::password:                                  ← self-reference (same table)
```

### Range references
```
ref::TableName::[tc_prefix_1-N]
```
- Square brackets `[prefix_1-N]` reference several TCs (prefix_1, prefix_2, ..., prefix_N)
- InstanceId MUST be empty for ranges (the code checks this and logs an error)
- Creates one copy of the calling TC per referenced TC
- **Cartesian product**: several range references in one TC multiply!

#### Range parsing (code: `processRanges`)
```
[invalid_1-7]   → invalid_1, invalid_2, ..., invalid_7
[valid_1-2]     → valid_1, valid_2
[T3-4]          → T3, T4
[a1-3,b1-2]     → a1, a2, a3, b1, b2  (comma-separated ranges)
```
Regex: `/(\D*)(\d+)-(\d+)$/` — non-digit prefix + start number + end number

### Valid/invalid strategy with ranges

Name sub-table TCs following the scheme `valid_N` and `invalid_N`.
The main table then has only 2 EqClasses per reference field:

```
billingScenario (FieldSubSection)
  valid      | ref::BillingAddress::valid_1           | single ref (1 fixture)
  invalid    | ref::BillingAddress::[invalid_1-7]     | range ref (7 fixtures)
```

**Why "valid" as a single ref, "invalid" as a range:**
- Error TCs need every error variant → the range expands automatically
- Non-target fields always reference valid_1 → no unnecessary multiplication
- Result: billingInvalid → 7 fixtures, datesInvalid → 4 fixtures, etc.
- The Cartesian product stays small: 1 × 1 × 9 = 9 (not 2 × 4 × 9 = 72)

**Naming convention for sub-tables (sequential!):**
```
invalid_1  ← first error case (error-first!)
invalid_2  ← second error case
...
invalid_N  ← last error case
valid_1    ← default happy path (all fields valid)
valid_2    ← variant (e.g. minimal required fields)
```

**Why sequential numbers in sub-tables:**
- Range references `[invalid_1-N]` need consecutive numbers
- The main table references `ref::SellerData::[invalid_1-17]` → expands to invalid_1, invalid_2, ..., invalid_17
- Descriptive names (e.g. `seller.name_empty`) would make range references impossible
- The mapping TC name → tested field/EqClass is visible from the table structure

**Naming convention for the main table (descriptive):**
```
format_xrechnung        ← descriptive name (no range ref to the main table)
sellerData_invalid      ← references the sub-table by range
buyerData_invalid       ← references the sub-table by range
valid_1                 ← happy path
```
Main tables are not referenced by range, so descriptive names can be used.

### Multi-sheet architecture
```
<name>-tests.xlsx
├── Sheet "MainTable"        ← main table (execute=T), CASCADE, 100%
│   subTableAScenario         ← valid (single ref) + invalid (range ref)
│   subTableBScenario         ← valid (single ref) + invalid (range ref)
│   directField1, field2      ← direct fields (valid/empty)
├── Sheet "SubTableA"        ← sub-table (execute=F), CASCADE, 100%
├── Sheet "SubTableB"        ← sub-table (execute=F), CASCADE, 100%
└── ...
```

### Important reference rules
- **ExecuteSection='F'** for sub-tables: TCs are executed only via reference, no fixtures of their own
- **Filters** in referenced TCs are NOT executed (only in the master TC)
- **Tags** from referenced TCs are collected
- **NeverExecuteSection**: prevents referencing from other TCs (opposite of ExecuteSection=F!)
- **Table names** must be unique across all loaded spreadsheets
- Every reference resolution creates a new instance of the referenced TC

### Splitting tables (multi-sheet strategy)

#### When to split?
- The table has more than 6-8 fields → combinations explode (e.g. 18 fields = 25M combinations)
- Field groups belong together logically (address, date, line items)
- Different main scenarios need different sub-tables
- Coverage below ~80% despite correct markers → the table is too big

#### The split follows the test object
The table structure mirrors the test object — not the other way round:
- **UI form**: each logical form section (tab, accordion, wizard step) can become a sheet
- **API endpoint**: the request body structure determines the split (nested objects → sub-sheets)
- **Business domain**: bounded contexts / aggregate boundaries as natural cut lines
- **Reuse**: the same sub-table (e.g. address) can be referenced by different main tables

#### Procedure

**1. Identify field groups:**
Divide fields that belong together in business terms into groups.

**2. Each group becomes a self-contained sheet:**
- Its own `<DECISION_TABLE>` header
- Its own test cases (happy path + error cases for this group)
- Its own coverage calculation → target 100% per sub-table
- Small number of combinations → 100% easy to reach

**3. The main table references the sub-sheets:**
- One FieldSubSection with reference EqClasses for each field group
- Each EqClass points to a TC of the sub-table

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

## Orchestration: data tables and test case tables

> The multi-sheet strategy above breaks **one large table** into parts. Alongside it there is
> a second, independent interplay: **entities** and **flows**. Anyone who confuses
> the two rewrites the same field definitions in every table.

### Two kinds of table

| | `Execute` | What it describes | Example |
|---|---|---|---|
| **Data table** | `F` | an **entity**: its fields and their EqClasses | `User`, `CompanyDE` |
| **Test case table** | `T` | a **flow**: which situations exist | `Registration`, `Login` |

A data table produces **nothing** on its own; it is only ever referenced.
The same `User` table serves registration, login and later customer creation — the
EqClasses for `email` exist **once** in the world.

🔴 **The tables must be sheets of ONE workbook.** References do not resolve across
file boundaries; a reference to another file reports
`The targetTable 'User' does not exists`. Separate files per table are fine for editing,
but must be merged before generating.

### A test case table defines cases, not fields

The most common beginner's mistake (and the most expensive one): writing all the fields
into the test case table again. It contains **almost no** field definitions. It names the
situations of the flow and pulls in the classes by reference.

Registration, complete — three fields, four test cases, 1 × 2 × 2 = 4 combinations, 100 %:

```
FieldSection "Secondary data"
  session (FSS)
    loggedOut           |                             | x | x | x | x
  existingUser (FSS)
    no                  |                             | x | x |   |
    yes                 | ref:1:User::OK_1            |   |   | x | x
FieldSection "Primary data"
  user (FSS)
    valid               | ref:1:User::OK_1            | x |   | x |
    invalid             | ref::User::[E_1-16]         |   | x |   | x
```

An **empty generator cell** means: the field gets no value (Nanook only logs an
info). For pure states like `loggedOut` that is right — the row names the
state, it needs no data. Column 3 is "user already exists, the same one is being
registered" (the same instance id `1`), column 4 "user exists, input invalid".

The 16 invalid cases are in **one cell**. If a 17th error case were added to `User`,
nothing changes here.

### The secondary data section *is* the base state

The generalisation that makes the suite writer possible in the first place:

- **Primary data** = what the test types in.
- **Secondary data** = what must be true beforehand — and that is exactly one base state.

So the writer does not have to guess it, it reads it off:

| Secondary data field | Value | Base state |
|---|---|---|
| `session` | `loggedOut` | nobody logged in |
| `existingUser` | *(empty)* | nothing to prepare |
| `existingUser` | `ref:1:User::OK_1` | create entity `User` via the API |

🔵 The reference says **both**: which entity and which data. What it does **not** say
is the *how* — which API route creates a user. That lives once per entity in the
runner, not in the table. A new entity means one more row, no change
to the generator.

### The same instance id twice = the same record

`ref:1:User::OK_1` in **two** cells of the same test case yields **one** user, not
two — the `1` is the instance id. That is exactly how you build "the user already exists":
create it once as the base state, type it in once as input.

Without an instance id (`ref::User::OK_1`) you get two independent records.

### A column of its own for a dedicated expectation

Sometimes the error message is the actual subject of the test — "this email already
exists" is something different from "invalid input". That is worth an **additional
column** rather than a branch in an existing one.

To keep the sum right, the subsequent fields in this column get `x`
on the preferred value and `i` on the rest: `i` counts for COUNTA but produces nothing.
That way the column costs no double coverage.

⚪ Additional columns that do **not** belong to the combinatorics go at the **end** and out of the
sum — and their name should show that.

### Composite generators

Fields may be built from other fields, via self-reference in the generator expression.
`template` and `mail` are **a project's own generators, not in the package** — the example
shows the pattern; anyone using it writes them themselves (extend `DataGeneratorBase` and register it):

```
firstName | gen::faker:person.firstName
lastName  | gen::faker:person.lastName
name      | gen::template:{firstName} {lastName}
email     | gen::mail:example.com          ← builds firstname.lastname@…, guaranteed unique
```

🔴 **A guarantee that never kicks in cannot be told apart from a broken one.**
If faker draws nothing but distinct names, the uniqueness logic never runs. The test for it
must **force** the collision (fixed names, three calls,
three different results).

### Three levels, not two — execution gets a sheet of its own

Data table and test case table are enough as long as an entity has **one** flow.
As soon as there are two (create *and* edit), the split no longer
holds — and you notice too late:

| Sheet | `Execute` | describes |
|---|---|---|
| `CompanyCommon` | `F` | what is the same in **every** country |
| `CompanyDE` · `CompanyES` | `F` | the fields of **one country**, including its legal consequences |
| `CreateCompanyDE` · `…ES` | `T` | the **execution**: base state and cases |

🔴 **The base state does NOT belong in the field table**, even if it is the same for
every case. Writing it there ties the **entity** to a
**flow** — and with the second flow someone starts over. The execution
sheet, on the other hand, is cheap: base state, two or three cases, the rest by
reference.

🔵 A data table may reference **another data table**:
`CompanyDE` pulls the shared master data from `CompanyCommon`, and
`CreateCompanyDE` pulls in `CompanyDE`. The chain can be arbitrarily deep — only at the top
is there exactly one sheet with `Execute = T`.

### Where the dividing line between countries runs

Not "master data versus country data", but: **are the equivalence classes
the same?**

That is why `postalCode` and `timezone` move into the country even though they look like master
data — their classes are the same (`valid`/`empty`/`wrongFormat`/…), their
**valid values** are not. And `phone` stays shared even though the dialling code
depends on the country: it is not validated, so nothing differs.

💡 **How you can tell the split pays off**: after separating into shared
and country tables, each further country costs only its own columns.

### Legal consequences belong in the effect section, not in the fields

The real reason countries need separate tables is **not**
the value list of `businessType`. It is what **follows** from the choice:

```
DE   legal form × § 19          →  bookkeeping type AND document form (2×2 matrix)
ES   no § 19 (there is none)    →  instead: who owns the tax identifier?
```

Spain has **no** small-business regime — the German axis does not exist there
at all. Instead it has one that DE does not: a company holds its own
identifier, a sole trader their personal one (which may be foreign).

⚪ Such cases get **their own columns at the end**, outside the
coverage sum: they do not test another field, but a coincidence of conditions.

### 🔴 A derived field is not an input

If the application assembles a value itself, it belongs in the **expectation**,
not in the primary data — otherwise the table describes an input that does
not exist.

Example: the Spanish VAT ID is `ES` + NIF/CIF, is calculated
and is `readOnly` in the form. Two fields with their own classes would simply be
wrong there. **Germany is the special case**, not the norm: there the
VAT ID and the tax number are two different numbers from two authorities.

💡 The question that decides it: *Can a human type in this value?* If
not, it is an effect.

### 🔴 Look up classes by NAME, never by index

A generator that takes `classes[1]` breaks the moment someone inserts a
class before it — and does so **silently**: the reference points to the wrong
class, the range reference disappears, and 32 test cases become 18, without
anything turning red.

Looking up by name gives you an error message on rename instead of a silent
data loss.

### Order of construction

1. **Data tables first** (`Execute = F`) — the entities the flow needs.
2. **Registration before login.** Login requires a user; without
   registration the user only exists via a third-party provider (Google/Apple), and then
   the test depends on the mock instead of the application.
3. **Then the flow** as a test case table that only names cases.
4. **Merge** separate files, then generate.

## CASCADE pattern for 100% coverage

### Concept
With the CASCADE technique, `a`/`e` markers are set only on fields that come **after** the target field in field order. Fields **before** the target field get only `x` on the preferred value (as in the happy path).

### Why does CASCADE work?
Each TC covers less than the previous one. The products form a decreasing series:
```
TC1 (field 1):  1 × 2 × 2 × 2 × 2 = 16  (a/e on fields 2-5)
TC2 (field 2):  1 × 1 × 2 × 2 × 2 =  8  (a/e on fields 3-5)
TC3 (field 3):  1 × 1 × 1 × 2 × 2 =  4  (a/e on fields 4-5)
TC4 (field 4):  1 × 1 × 1 × 1 × 2 =  2  (a/e on field 5)
TC5 (field 5):  1 × 1 × 1 × 1 × 1 =  1  (no field after it)
TC6 (happy):    1 × 1 × 1 × 1 × 1 =  1
                                      ──
Sum:                                  32 = 2^5 = total
```

### Precondition for exactly 100%
**Every non-preferred EqClass needs its own error TC.**
Then the sum of the products equals the total exactly.

**Special case: all fields have 2 EqClasses:**
```
total = 2^n   (n = number of fields)
sum   = 2^(n-1) + 2^(n-2) + ... + 2^0 + 1 = 2^n
```

**General: fields with different EqClass counts (e.g. 3, 2, 2, 2, 3, 3):**
Works too! Each non-preferred EqClass gives a TC with product:
```
product(TC) = 1^(fields before) × product(EqClass counts of the fields after)
```
All products + happy path(1) = total.

**Example BillingAddress (3x2x2x2x3x3 = 216):**
```
billingName:   empty(72) + whitespace(72)          = 144
street:        empty(36)                           =  36
postalCode:    empty(18)                           =  18
city:          empty(9)                            =   9
country:       invalid_3chars(3) + empty(3)        =   6
customerEmail: invalid(1) + empty(1)               =   2
happy:                                             =   1
                                               Sum: 216 = 100%
```

### Implementation
Every non-happy TC needs a **target field** (the field it tests). The fields must have a fixed order.

**Marker logic per TC:**
1. **Happy-path TC**: all fields `x` on preferred → product = 1
2. **Error/target TC**:
   - Target field: `x` on target EqClass → COUNTA = 1
   - Fields BEFORE the target field: `x` on preferred → COUNTA = 1
   - Fields AFTER the target field: `a` on preferred, `e` on the rest → COUNTA = n

### When to use CASCADE?
- Main tables with reference fields (valid/invalid per ref → 2 EqClasses)
- Sub-tables with any EqClass counts per field
- When the coverage sum should hit the total exactly (100%)

### When NOT to use CASCADE?
- When fields belong together logically and must always be marked together
- When >100% coverage is deliberately wanted (maximum coverage)

### TC order: error-first
More readable for humans: **error TCs first, valid TCs last.**
The CASCADE staircase pattern (a/e markers from left to right) becomes visible immediately.
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
The a/e markers form a triangle — you can see at once whether the pattern is right.

## Important notes

- `exceljs` is 1-based (column 1 = A, row 1 = first row)
- Write formulas with `{ formula: '...' }`, NOT as a string
- The percentage cell needs `numFmt: '0.00%'`
- Call `row.commit()` after changes
- Styling is applied AFTER writing the data (otherwise commit() overwrites the style)
- Nanook's ImporterXlsx reads the Excel file — the formulas do not need to be calculated, but the structure must be right
- Complete example (login form, two sheets, workbook and fixtures):
  https://nanook.xhub.io/blog/2026/08/22/login-example-ai-generated-table
- Background to the rules above: `notes.md` next to this file (not needed for the work)
