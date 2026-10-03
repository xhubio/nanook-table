---
name: generate-test-data
description: >
  nanook.xhub: Generate test data from an existing Nanook decision table (XLSX/XLS) with
  @xhubio/nanook-table: inspect the workbook, register or write the generators it calls,
  write one JSON fixture per test case, check the count and use the fixtures in Vitest or
  Playwright tests. Use when a table already exists and the user wants test data, fixtures or
  data-driven tests from it, or when a Nanook run yields fewer test cases than expected,
  missing fields or "no generator registered". To draft a new table, use
  create-equivalence-class-table instead. Also: "generate test data", "fixtures from table",
  "nanook generate", "Testdaten generieren".
license: MIT
metadata:
  version: "0.4.1"
---

# nanook.xhub: Generate test data from an existing table

Takes a workbook with Nanook decision tables that already exists, hand-made, from an older
Nanook version or from the `create-equivalence-class-table` skill, and turns it into one JSON
fixture per test case that tests can read. Nanook does not throw on a failed generator or an
unresolved reference, it logs and carries on, so every step here ends with a check.

## Environment and bundled scripts

- Project with `@xhubio/nanook-table` (3.1.0 or later, ESM). No `exceljs` needed.
- Node.js 22.18 or later runs `.ts`/`.mts` directly; older 22.x need
  `--experimental-strip-types`, `npx tsx` works everywhere.
- Default locations: `resources/<name>-tests.xlsx`, `fixtures/<name>/`, own generators in
  `scripts/generators/`. If the user names other folders, use theirs.
- **Output language**: write comments, messages and test names in the language of the user's
  request, not in the language of these instructions.

Two finished, tested scripts are in the `scripts/` folder next to this `SKILL.md` and, from
`@xhubio/nanook-table` 3.2.0, in the project under
`node_modules/@xhubio/nanook-table/skills/generate-test-data/scripts/`.
**Copy them from there**: that folder is inside the project, the plugin folder is often outside it and
then not readable. Run them only inside the project: Node resolves imports relative to the script and
does not strip TypeScript types under `node_modules`. If `cp` is not allowed, read the file
and write it into the project **unchanged**. **Never rewrite them**: the scripts are
tested, a rewrite is not. The one place meant to be edited is the generator registration in
`generate-fixtures.mts` (step 3). If neither source can be found, tell the user so instead of
building a substitute.

```
cp node_modules/@xhubio/nanook-table/skills/generate-test-data/scripts/*.mts scripts/
node scripts/inspect-workbook.mts resources/<name>-tests.xlsx
node scripts/generate-fixtures.mts resources/<name>-tests.xlsx fixtures/<name>
```

**With 3.1.x** the package has no `generate-test-data` folder. Copy `generate-fixtures.mts` from
`node_modules/@xhubio/nanook-table/skills/create-equivalence-class-table/scripts/`; there is no
`inspect-workbook.mts` then. Skip step 1, tell the user that upgrading to 3.2.0 adds the check,
and count by hand in step 5: one fixture per column with a true Execute value, times
Multiplicity, plus one per further element of a range reference.

| Script | What it does | Exit 1 if |
|---|---|---|
| `inspect-workbook.mts` | reads the workbook with Nanook's parser; lists every table with its columns, Execute, NeverExecute, Multiplicity, filters and the minimum fixture count; lists every `gen:` grouped by generator and checks every `ref:` | a generator or filter processor is not registered in `generate-fixtures.mts` (read from the file next to it), a faker path does not exist, a `text` instruction is unknown, a reference in an executed column points to a missing table, field or test case, the loader logged an error |
| `generate-fixtures.mts` | Nanook reads the workbook, generators `faker` and `text` and the filter processors `SimpleArrayFilter` and `SimpleArrayIgnoreFilter` are registered, one JSON per test case (`<table>.<testcase>.json`), count per table; `--verbose` prints Nanook's log | Nanook logged errors |

The `text` generator provides the edge cases `faker` cannot: `gen::text:empty`,
`gen::text:spaces:N`, `gen::text:alpha:N`, `gen::text:email:N` (N letters + `@example.com`).

## Workflow

### Step 1: Inspect the workbook
Run `inspect-workbook.mts` and read the output **before** generating anything. Note:
- which tables are executed (`execute`) and how many fixtures each must yield at least,
- columns marked `+range` (one fixture per element of the range, name gets `-1`, `-2`, …),
- columns marked `dropped` (they reference a test case with NeverExecute; Nanook skips them),
- columns marked `filter` (not in the minimum: the filter keeps them only if a tag in their call
  tree matches; with a range it decides per element),
- every generator marked `NOT REGISTERED`, every filter processor reported as not registered.
- Warnings about references in columns that are not executed matter only if another column
  references that column.

If the user only gave a folder, look for `*.xlsx`/`*.xls` there and ask which workbook is meant
when there are several. Tables referenced across workbooks are not supported by the scripts:
they load one file.

### Step 2: Resolve the generators
For every unregistered generator decide with the user, in this order:
1. **The cell is wrong**: a typo (`fakr`), a faker call with arguments (`string.alpha(5)`,
   use `gen::text:alpha:5`), a path from an old faker version (`name.firstName` is
   `person.firstName` today, `address.city` is `location.city`), a generator from an old project
   that faker or `text` covers → propose the corrected cell, the user changes the workbook.
2. **The project already has the generator** (search for `extends DataGeneratorBase`) →
   import and register it.
3. **It must be written** → step 3.

Never invent what an unknown generator returns. Ask what `gen::kundennr:` is meant to produce
(format, uniqueness, relation to other fields) before writing it.

### Step 3: Write and register own generators
Put each generator in its own file under `scripts/generators/`, import it into
`generate-fixtures.mts` and register it next to `faker` and `text`; `inspect-workbook.mts`
reads the registrations from there.

```ts
// scripts/generators/GeneratorCustomerNo.ts
import { DataGeneratorBase } from '@xhubio/nanook-table'
import type { DataGeneratorGenerateRequest } from '@xhubio/nanook-table'

// gen:<id>:customerNo:<prefix>   e.g. gen:1:customerNo:K  ->  K-000001, unique per run
export class GeneratorCustomerNo extends DataGeneratorBase {
  private counter = 0

  protected doGenerate(request: DataGeneratorGenerateRequest): Promise<string> {
    const prefix = request.generatorDirective?.config || 'K'
    this.counter++
    return Promise.resolve(`${prefix}-${String(this.counter).padStart(6, '0')}`)
  }
}
```

```ts
// generate-fixtures.mts, after the two existing registrations
import { GeneratorCustomerNo } from './generators/GeneratorCustomerNo.ts'
registry.registerGenerator('customerNo', new GeneratorCustomerNo({ generatorRegistry: registry, name: 'customerNo', logger }))
```

Rules for generators:
- `doGenerate` gets the part after the third colon as `request.generatorDirective.config`
  (colons inside it are kept). Parse it, reject unknown configs with an error:
  `DataGeneratorBase` logs it and the field stays empty, `generate-fixtures.mts` exits 1.
- **Same instance id = same entity.** `gen:1:person:firstName` and `gen:1:person:email`
  in one test case get the same `request.instanceId`; a generator that builds one record per
  id in `doGenerate` and returns a field of it keeps them consistent (see
  `docs/tutorials/create-generator.md`). `gen::…` (empty suffix) uses the id of the test case,
  shared by all its `gen::` cells.
- **Caching**: `DataGeneratorBase` calls `doGenerate` once per instance id **and** config, so
  `gen::customerNo:A` and `gen::customerNo:B` in one test case get their own values. Up to
  Nanook 3.2.0 it cached per instance id only and every `gen::` cell of a generator got the
  first value; on those versions add to the class:
  `` generate(r) { return super.generate({ ...r, instanceId: `${r.instanceId}:${r.generatorDirective?.config ?? ''}` }) } ``
- **A field built from other fields** returns `undefined` while one of them is missing;
  Nanook calls it again after the other directives ran. The record of the test case is
  `request.testcaseData.data[<table>][<instance id of the node>]`:

```ts
// gen::template:{first-name}.{last-name}@example.com
protected doGenerate(request: DataGeneratorGenerateRequest): Promise<string | undefined> {
  const directive = request.generatorDirective
  const template = directive?.config ?? ''
  const nodeId = (directive as { node?: { instanceId: string } } | undefined)?.node?.instanceId ?? ''
  const record: Record<string, unknown> =
    request.testcaseData?.data?.[directive?.testcaseMeta.tableName ?? '']?.[nodeId] ?? {}
  const names = [...template.matchAll(/\{([^}]+)\}/g)].map((m) => m[1])
  if (names.some((name) => record[name] === undefined)) return Promise.resolve(undefined)
  return Promise.resolve(template.replace(/\{([^}]+)\}/g, (_, name: string) => String(record[name])))
}
```

- **Uniqueness** (`uniqueSet` of `DataGeneratorBase`, or a counter as above) is only tested
  when the test forces the collision: fixed inputs, several calls, different results.
- **Store values across runs** only with `useStore: true` and a `varDir`; otherwise every run
  starts fresh.

Run `inspect-workbook.mts` again: no `NOT REGISTERED` left.

### Step 4: Generate
```
node scripts/generate-fixtures.mts resources/<name>-tests.xlsx fixtures/<name>
```
The script deletes the `*.json` files in the target folder first, nothing else. Rerun with
`--verbose` to see Nanook's log when something is off.

### Step 5: Check the count
Compare the count per table with step 1: at least the minimum, more only for `+range`
columns. **Fewer means a test case was dropped** even if the exit code is 0 for some reason;
see Troubleshooting. Open two or three fixtures and check that every field has a value
and that values meant to differ (empty, too long, invalid) do differ.

The output is random where the table leaves a choice (faker; several `e` markers in one
column, of which Nanook picks one at random). Do not commit fixtures as a golden master unless
the user wants exactly that; generate them in the test run or in CI instead.

### Step 6: Use the fixtures in tests
Ask which test runner the project uses, then write a data-driven test that reads the folder.
Keep the expected result in the table (an `Expected Result` MultiRowSection, see below)
instead of hard-coding it per test case, so a new column in the table needs no change in the test.

**Vitest**
```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import type { TestcaseDataInterface } from '@xhubio/nanook-table'

const DIR = path.join(import.meta.dirname, '../fixtures/<name>')
const fixtures: TestcaseDataInterface[] = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))

// the record of the test case's own table (see "The fixture" when it has none)
const recordOf = (tc: TestcaseDataInterface) => tc.data[tc.tableName]?.[tc.instanceId] ?? {}

describe.each(fixtures)('$tableName $name', (tc) => {
  it('is handled as the table expects', async () => {
    const { 'Expected Result': expected, ...input } = recordOf(tc)
    const result = await register(input) // the code under test
    expect(result.errorCode ?? 'valid').toBe(expected[0].key)
  })
})
```

**Playwright**
```ts
import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const DIR = path.join(import.meta.dirname, '../fixtures/<name>')
// fixtures are named <table>.<testcase>.json: take the table this page test is about
for (const file of fs.readdirSync(DIR).filter((f) => f.startsWith('<table>.') && f.endsWith('.json'))) {
  const tc = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  const input = tc.data[tc.tableName]?.[tc.instanceId] ?? {}
  const [expected] = input['Expected Result']
  test(`${tc.tableName} ${tc.name}`, async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill(input.email)
    // … one fill per field
    await page.getByRole('button', { name: 'Register' }).click()
    if (expected.key === 'valid') await expect(page).toHaveURL(/welcome/)
    else await expect(page.getByRole('alert')).toHaveText(expected.other)
  })
}
```

Field names are the names in column A of the table, exactly as written there (`first-name`,
`E-Mail`). A MultiRowSection such as `Expected Result` arrives as an array of the marked rows,
`[{ key: <column C>, other: <column D>, comment: <column E> }]`; check its name and columns in
the workbook before writing the test. Generate the fixtures before the test run, e.g. `"pretest": "node scripts/generate-fixtures.mts …"`.

## The fixture

```
{
  tableName, name, instanceId,
  data: { <table>: { <instance id>: { <field>: <value> } } },
  callTree: { tableName, testcaseName, instanceId, neverExecute, tags, children: [...] },
  postProcessDirectives: []
}
```

- `data[tableName][instanceId]` is the record of the test case itself: one entry per field,
  MultiRowSections as arrays of `{ key, comment, other }`. Use the top-level `instanceId`:
  `callTree.instanceId` of the root is a different id (Nanook renews the ids after building
  the call tree).
- **A table without a record of its own**: when every field of the test case is a reference to a
  whole record, `data[tableName]` does not exist. The referenced records are reached through the
  call tree, whose children ids do match `data`:
  `tc.callTree.children.map((c) => tc.data[c.tableName][c.instanceId])`.
- **References**: the referenced records are in `data` under their own table and instance id.
  A reference with a field name also copies that value into the referencing field; a reference
  to a whole record (`ref:<id>:<table>::<testcase>`) adds no field, read the record from `data`.
- `callTree` mirrors the references; `tags` comes from the TagSection of each table in it.
- **Names**: `<column>` normally; `<column>-1`, `-2`, … when a range reference fans out;
  `<column>.1`, `.2`, … with Multiplicity.

## Directives in a cell

Full reference: `docs/guide/directives.md` in the package.

| Cell | Meaning |
|---|---|
| `DE`, `100`, `not-an-email` | static value, taken as it is (a string) |
| `gen:<id>:<generator>:<config>` | value from a registered generator; same `<id>` = same entity within the test case |
| `gen:1:faker:person.firstName` | faker, **a path only, no arguments** |
| `ref:<id>:<table>:<field>:<testcase>` | value of `<field>` in `<testcase>` of `<table>` |
| `ref:<id>:<table>::<testcase>` | the whole record of that test case |
| `ref::<table>:<field>:[tc2-tc4]` | a range: one fixture per element; a range must not have an `<id>` |
| `ref:::<field>:` | self-reference: another field of the same test case (2.1.3 or later) |

ExecuteSection: `t y j 1 yes ja si true ok` (any case) is **true**, everything else is false,
**`x` included**. A table without an ExecuteSection is executed completely.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `There was no generator registered with the name 'x'` | the generator is not registered; the whole test case is dropped | step 2 |
| fewer fixtures than the minimum, no error | a referenced test case has NeverExecute (`dropped` in step 1), or a FilterSection excluded it | intended? otherwise remove the NeverExecute or the filter |
| fewer fixtures, error in the log | `faker` threw (a path that does not exist); the test case is dropped | `inspect-workbook.mts` names the cell |
| a field is missing in the fixture, `Error in generating data` or the generator's message | an own generator rejected; the field stays empty, the test case is written | `--verbose`, fix the generator or the config |
| a field is missing in the fixture, `Could not resolve all the fields` | a reference or a generator never got its value (cycle, missing field, generator returns `undefined` forever) | check the reference target; a composite generator must name existing fields |
| `The targetTable 'X' does not exists` | the table name in `ref:` does not match a sheet name (case and spaces count) | correct the reference |
| every `ref:` fails in an own script | `tables` passed as the array from `fileProcessor.tables` | key them by `tableName` (as `generate-fixtures.mts` does) |
| several fields of one test case have the same random value | Nanook 3.2.0 or older (cache per instance id only), or an own `generate()` override that caches by id alone | upgrade, or see "Caching" in step 3 |
| a table yields nothing | no column has a true Execute value (`x` is false) | `T` / `1` / `yes` |
| a second sheet with the same name replaced the first | Nanook keys tables by name, a duplicate overwrites (warning in step 1) | rename one of them |
| `Method not implemented` in `before()` | an own script uses `createDefaultWriter()`; it is a stub | use the writer from `generate-fixtures.mts` |
| `A filterProcessor with the name 'X' does not exists. Filter is ignored` | the FilterSection names a processor `generate-fixtures.mts` does not register | use `SimpleArrayFilter`/`SimpleArrayIgnoreFilter` in the table, or write one (`name` and `filter(tags, expression)`) and add it with `processor.addFilterProcessor(new X({ name: 'X' }))` next to the two existing ones |

## After generating

Tell the user:
- the count per table and the total, against the minimum from step 1,
- which generators were written or changed and what they produce,
- which cells you proposed to change in the workbook and why,
- where the fixtures are and how the test reads them.

The workbook stays the source: changes to test cases go into the table, not into the fixtures.
To change or extend the table itself, use the `create-equivalence-class-table` skill.
