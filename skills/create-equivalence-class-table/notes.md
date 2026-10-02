# Notes behind the rules in SKILL.md

Background for maintainers. The skill does not need this file to work; the rules in
`SKILL.md` are the result, this is where they came from. Observations from one project's
tables (August 2026, Nanook 2.x/3.0).

- **`a` on the valid class in error test cases.** A test case expected a field-level
  rejection for a too-long password and got `Password too long` from the server instead.
  Both messages were true; the second belonged to a different limit and hid the first.
  Hence: the other fields get `a` on their valid class so the expected error is the one
  that shows.
- **`e` in the happy path means "irrelevant here", by decision of the table owner.** The
  preferred class then needs its `x` in another column: opening the happy path itself left
  four classes without a test case in one table; the class check found it.
- **`e` does not scatter.** With an `a` in the field, `a` wins every time; two runs gave
  identical values.
- **100 % is always reachable, the cascade is not always the way.** A first version of the
  skill claimed the opposite. One country table stood at 66.85 % by choice, because the
  missing combinations would have to be enumerated column by column.
- **Uniqueness logic that never fires.** Faker drew 19 different names in a real run; the
  uniqueness branch of a custom `mail` generator never ran. Its test has to force the
  collision.
- **Splitting by country.** One table had 45 columns for one country; after the split
  20 common + 22 German + 19 Spanish, and the second country cost almost nothing.
- **Classes by name, not by index.** A generator script that took `classes[1]` broke
  silently twice on one day after a class was inserted: 32 test cases became 18, nothing
  turned red.
- **Self-references before 2.1.3.** A self-reference in a referenced data table left the
  field empty without an error; a test case table produced 3 cases instead of 7.
