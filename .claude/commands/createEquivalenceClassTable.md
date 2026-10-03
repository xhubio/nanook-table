# /createEquivalenceClassTable

> Also available as a plugin since skill 0.2.0: `/plugin marketplace add xhubio/nanook-table`, then
> `/plugin install nanook@nanook`; there the skill is `/nanook:create-equivalence-class-table`.

Creates a nanook.xhub decision table (equivalence class table) as a formatted Excel file for a given test object.

## Usage

```
/createEquivalenceClassTable <page name, API endpoint or form description>
```

## What happens

1. Reads the `create-equivalence-class-table` skill (`skills/create-equivalence-class-table/SKILL.md` in the package)
2. Analyses the test object (fields, validations, field groups)
3. Defines equivalence classes per field from common patterns
4. Plans test cases with CASCADE for 100 % coverage
5. Writes a TypeScript script that generates the Excel file
6. Verifies: build the workbook, check the coverage (`check-classes.mts`), generate fixtures (`generate-fixtures.mts`)

## Examples

```
/createEquivalenceClassTable Invoice Create Page
/createEquivalenceClassTable Customer Registration Form
/createEquivalenceClassTable POST /api/v1/orders
```

## Result

- TypeScript script in `scripts/create-<name>-table.ts`
- Excel file in `resources/<name>-tests.xlsx`
- Formatted with colours, formulas, CASCADE markers
- 100 % coverage per sheet

## Next steps

After the table is created:
1. Open the workbook in a spreadsheet app and check markers and coverage
2. Register further generators in `scripts/generate-fixtures.mts` if the table calls any
3. `node scripts/generate-fixtures.mts resources/<name>-tests.xlsx` to generate the fixtures
4. For own generators, a count that does not match and data-driven tests from the fixtures, use the
   skill `generate-test-data` (`/nanook:generate-test-data` in the plugin)

---

**Skill reference**: run the skill `create-equivalence-class-table` with the given test object as context.
