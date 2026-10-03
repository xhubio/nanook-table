# Rules block for a project's AGENTS.md

Paste the block below into the `AGENTS.md` of a project that uses `@xhubio/nanook-table`.
Codex, Cursor, GitHub Copilot and other agents read `AGENTS.md` from the project root; for
Claude Code, add the line `@AGENTS.md` to `CLAUDE.md`. The markers let you replace the block
later without touching the rest of the file. The same block is on
https://nanook.xhub.io/docs/guide/use-with-ai.

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
