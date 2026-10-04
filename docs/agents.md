# Nanook

Nanook turns test cases written as decision tables in an XLSX workbook into test data: one
JSON fixture per test case, ready for Vitest, Playwright or any other runner. The table names
the equivalence classes of every field and marks which class each test case uses; generators
fill in the values. Package: `@xhubio/nanook-table`, ESM only, Node.js 22 or newer, MIT.

This page is the complete guide for AI agents adding Nanook test cases and test data to a
project. Work through it top to bottom.

- npm: https://www.npmjs.com/package/@xhubio/nanook-table
- repo: https://github.com/xhubio/nanook-table
- docs index: https://nanook.xhub.io/llms.txt

## 1. Know the target first

Nanook needs a test object: a form, a page or an API endpoint, and its validation rules.

- If the user named none, **ask which one** before installing anything.
- If the project already has a Nanook workbook (`*.xlsx` with a `<DECISION_TABLE>` sheet,
  often under `resources/`), the job is **B** below; otherwise it is **A**.
- Read the code of the test object (form component, request schema, validators) for fields,
  required flags, lengths, formats and error codes. Write down every assumption that did not
  come from the code or the user; you report it at the end.
- Write comments, messages and test names in the language of the user's request.

## 2. Install

```sh
npm install @xhubio/nanook-table
npm install -D exceljs          # only for A: drafting a workbook
# new project: npm init -y && npm pkg set type=module
```

Node.js 22.18 or later runs the `.mts` scripts below directly; older 22.x need
`--experimental-strip-types`, `npx tsx` works everywhere.

## 3. The two jobs

The package ships two skills with the full rules and three tested scripts. **Read the
`SKILL.md` of your job from the installed package before you write anything**: it matches the
installed version, this page does not go into every detail.

| Job | Read | Scripts |
| --- | --- | --- |
| **A**: draft a new table for the target, then generate data | `node_modules/@xhubio/nanook-table/skills/create-equivalence-class-table/SKILL.md` | `check-classes.mts`, `generate-fixtures.mts` |
| **B**: generate data from an existing table, use it in tests | `node_modules/@xhubio/nanook-table/skills/generate-test-data/SKILL.md` | `inspect-workbook.mts`, `generate-fixtures.mts` |

Copy the scripts into the project and run them there. **Never rewrite them**: they are tested,
a rewrite is not. The one place meant to be edited is the generator registration in
`generate-fixtures.mts`.

```sh
mkdir -p scripts
cp node_modules/@xhubio/nanook-table/skills/create-equivalence-class-table/scripts/*.mts scripts/
cp node_modules/@xhubio/nanook-table/skills/generate-test-data/scripts/*.mts scripts/
```

Agents that read Agent Skills can install both skills instead:
`npx skills add xhubio/nanook-table --skill create-equivalence-class-table` (and
`--skill generate-test-data`). In Claude Code: `/plugin marketplace add xhubio/nanook-table`,
then `/plugin install nanook@nanook`.

### A: draft a new table

1. List the fields of the target. Up to 6 fields: one sheet. More: split by the structure of
   the target (form sections, nested API objects) into data tables (`Execute` = `F`) and one
   test case table (`Execute` = `T`) that pulls them in by reference. All sheets in **one**
   workbook: references do not resolve across files.
2. Give every field at least two equivalence classes: the valid one and each invalid or
   alternative one that matters to the business. Invalid classes carry an error code.
3. Plan the test cases: one per non-preferred class (error cases first), one happy path last.
   That is the CASCADE pattern and reaches 100 % coverage.
4. Write `scripts/create-<name>-table.ts` with `exceljs` that builds
   `resources/<name>-tests.xlsx` exactly in the layout the skill describes (columns A–E, test
   cases from F, section rows, `COUNTA` and summary formulas), run it.
5. `node scripts/check-classes.mts resources/<name>-tests.xlsx`: exit 0 means 100 % coverage
   and every class has a test case with its own `x`.
6. `node scripts/generate-fixtures.mts resources/<name>-tests.xlsx fixtures/<name>`, then
   check the count (section 5).

### B: generate data from an existing table

1. `node scripts/inspect-workbook.mts resources/<name>-tests.xlsx`: read the minimum fixture
   count per table and every generator marked `NOT REGISTERED`.
2. For each unregistered generator: fix a wrong cell (typo, faker call with arguments, old
   faker path), reuse a generator the project has (`extends DataGeneratorBase`), or write one
   under `scripts/generators/` and register it in `generate-fixtures.mts`. Never guess what an
   unknown generator returns: ask.
3. Run `inspect-workbook.mts` again until nothing is unregistered, then
   `generate-fixtures.mts` and check the count (section 5).
4. Write a data-driven test that reads the fixture folder (examples for Vitest and Playwright
   in the skill).

## 4. What goes in a cell

Pick by what the test case needs, not by habit. Full reference:
`node_modules/@xhubio/nanook-table/docs/guide/directives.md`.

| Need | Cell |
| --- | --- |
| A fixed valid or invalid value | the value itself: `DE`, `100`, `not-an-email` |
| A realistic value | `gen:1:faker:person.firstName` (a Faker path, **no arguments**) |
| Several fields of one person or entity | the same instance id: `gen:1:faker:person.firstName`, `gen:1:faker:internet.email` |
| An empty value | `gen::text:empty` (empty cells are no value, the importer trims) |
| Spaces only | `gen::text:spaces:3` |
| Too long | `gen::text:alpha:300` |
| An email of a given length | `gen::text:email:40` |
| Anything faker and `text` cannot produce | an own generator, `gen::<name>:<config>` |
| A whole record from another table | `ref:1:User::OK_1` |
| One field of another table's record | `ref:1:User:email:OK_1` (field **before** test case) |
| Every error variant of a data table | `ref::User::[E_1-16]`: one fixture per element, no instance id |
| Another field of the same test case | `ref:::password:` |
| A pure state that needs no data (`loggedOut`) | leave the generator cell empty |

| Need | Marker in a test case column |
| --- | --- |
| The class this test case is about | `x`, and nothing else in that field |
| Happy path, every field | `x` on the preferred valid class |
| Error case, fields before the target | `x` on the preferred valid class |
| Error case, fields after the target | `a` on the valid class, `e` on every other class |
| A valid field irrelevant to the test object (happy path) | `e` on all valid classes, never on an error class |
| A logically impossible combination | `i` (counts for coverage, generates nothing) |
| Generate this table | `T` in the Execute row. **`x` there means false** |
| Only reachable by reference | `F` in the Execute row |

Every test case also gets one `x` in the `Expected Result` MultiRowSection (the row of its
error code, or `valid`) and one in the `Category` TagSection (`negative` or `valid`).

## 5. Check the count, every run

Nanook does not throw on a failed generator or an unresolved reference: it logs, drops the
test case or leaves the field empty, and goes on. So after every run:

- Per executed table, fixtures ≥ test case columns with a true Execute value (times
  Multiplicity), plus one per further element of a range reference. **Fewer means a test
  case was dropped**, even with exit code 0. Rerun with `--verbose` for Nanook's log.
- Open two or three fixtures: every field has a value, and values meant to differ (empty, too
  long, invalid) do differ.
- Do not commit fixtures as a golden master unless the user asks: faker output is random.
  Generate them before the test run (`"pretest": "node scripts/generate-fixtures.mts …"`).

A fixture is `{ tableName, name, instanceId, data, callTree }`; the record of the test case is
`data[tableName][instanceId]`, one entry per field (named as in column A), a MultiRowSection
as an array of `{ key, other, comment }`.

## 6. Rules for own scripts

Only needed when you write generation code yourself instead of using `generate-fixtures.mts`.
The same block is meant for the project's `AGENTS.md` (see
`node_modules/@xhubio/nanook-table/docs/agents-snippet.md`).

```markdown
<!-- BEGIN:nanook-agent-rules -->
## Nanook: test cases and test data

Test cases are defined in XLSX workbooks and turned into test data with
@xhubio/nanook-table (Node.js 22 or newer, ESM).

- Before writing a table or a generation script, read the docs for the
  installed version: node_modules/@xhubio/nanook-table/docs/
  (guide/decision-tables.md, guide/directives.md, api/processor.md).
  Website index: https://nanook.xhub.io/llms.txt
- Every generator a table calls (gen:<instanceId>:<generator>:<parameter>)
  must be registered in the DataGeneratorRegistry. The built-in
  GeneratorFaker takes a Faker path and no arguments; anything else
  needs its own generator.
- Pass the tables to TestcaseProcessor keyed by table name, not as the
  array from FileProcessor, or every ref: fails.
- Up to 3.2.x the default writer throws in before() and the default
  registry is empty; use an inline InterfaceWriter and register faker
  yourself. From 3.3.0 both work.
- LoggerMemory keeps only errors by default; set logger.level =
  'warning' to see warnings as well.
- After generating, compare the number of test cases with the number of
  test-case columns (plus one per extra element of a range reference).
  Fewer means a generator failed: Nanook logs the error and goes on.
<!-- END:nanook-agent-rules -->
```

## 7. Report back

Tell the user:

- the fixture count per table and in total, against the expected count,
- the coverage from `check-classes.mts` (job A),
- every assumption that did not come from their request or the code (lengths, error codes,
  formats),
- which generators you wrote and what they produce, which cells you propose to change,
- where the workbook, the fixtures and the test are, and that they should open the workbook
  in a spreadsheet application to review it.

The workbook stays the source: changes to test cases go into the table, not into the fixtures.
