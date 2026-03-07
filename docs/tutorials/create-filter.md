# Create a Custom Filter Processor

When working with large decision tables containing dozens or hundreds of test cases, you often want to process only a subset. For example, you might want to run only the "smoke test" cases during development, or skip test cases tagged as "slow" during continuous integration. Filter processors let you control which test cases get generated.

## How Filtering Works

Filtering in Nanook involves three components that work together:

1. **TagSection** -- A section in the decision table where you assign labels (tags) to test cases.
2. **FilterSection** -- A section in the decision table that specifies which filter processor to use and what expression to evaluate.
3. **FilterProcessor** -- A TypeScript class registered with the `TestcaseProcessor` that evaluates whether a test case's tags match a filter expression.

The flow is:

1. The processor reads all tags assigned to a test case from the TagSection.
2. The processor reads the filter definitions from the FilterSection.
3. For each filter definition, it looks up the named filter processor and calls its `filter(tags, expression)` method.
4. If any filter returns `false`, the test case is skipped.
5. If multiple filters are defined, they are combined with AND logic -- all filters must return `true` for the test case to be processed.

## Setting Up Tags and Filters in the Spreadsheet

### Adding a TagSection

Add a TagSection to your decision table. It works like any other section:

| A         | B          | C           | D | E                         | F   | G   | H   | I   |
| --------- | ---------- | ----------- | - | ------------------------- | --- | --- | --- | --- |
| Tags      | TagSection |             |   |                           |     |     |     |     |
|           |            | smoke       |   | Core functionality tests  | x   |     | x   |     |
|           |            | regression  |   | Full regression suite     |     | x   | x   | x   |
|           |            | slow        |   | Tests that take long      |     |     |     | x   |

In this example:

- TC1 is tagged with "smoke".
- TC2 is tagged with "regression".
- TC3 is tagged with both "smoke" and "regression".
- TC4 is tagged with "regression" and "slow".

Place an `x` in a test case column to assign that tag to the test case. A test case can have multiple tags.

### Adding a FilterSection

Add a FilterSection below the TagSection (or anywhere in the table):

| A         | B             | C                    | D | E                                    |
| --------- | ------------- | -------------------- | - | ------------------------------------ |
| Filter    | FilterSection |                      |   |                                      |
|           |               | SimpleArrayFilter    |   | smoke                                |

The columns in a FilterSection row are:

- **Column C** -- The name of the filter processor to use (must match a registered processor).
- **Column E** -- The filter expression passed to the processor.

In this example, the filter uses the `SimpleArrayFilter` processor with the expression "smoke". Only test cases that have the "smoke" tag will be processed.

## Built-in Filter Processors

Nanook provides two built-in filter processors.

### SimpleArrayFilterProcessor (Include Filter)

This filter includes test cases that match the expression. It splits the expression by a delimiter (default `;`) and checks if any token appears in the test case's tags.

**Behavior:** Returns `true` if at least one token in the expression matches a tag. Returns `false` otherwise.

```
Expression: "smoke;critical"
Tags: ["regression", "smoke"]
Result: true (because "smoke" matches)

Expression: "smoke;critical"
Tags: ["regression", "slow"]
Result: false (neither "smoke" nor "critical" is in the tags)
```

### SimpleArrayIgnoreFilterProcessor (Exclude Filter)

This filter excludes test cases that match the expression. It is the inverse of the include filter.

**Behavior:** Returns `false` if any token in the expression matches a tag. Returns `true` otherwise.

```
Expression: "slow"
Tags: ["regression", "slow"]
Result: false (test case is excluded because "slow" matches)

Expression: "slow"
Tags: ["regression", "smoke"]
Result: true (test case is included because "slow" is not in the tags)
```

## Registering Built-in Filters

Register the filter processors with the `TestcaseProcessor` using `addFilterProcessor()`:

```typescript
import {
  LoggerMemory,
  TestcaseProcessor,
  SimpleArrayFilterProcessor,
  SimpleArrayIgnoreFilterProcessor,
  createDefaultFileProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter
} from 'nanook-table'

async function main() {
  const logger = new LoggerMemory()
  logger.writeConsole = true

  const fileProcessor = createDefaultFileProcessor(logger)

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry: createDefaultGeneratorRegistry(),
    writer: createDefaultWriter(logger),
    tables: {}
  })

  // Register the include filter
  processor.addFilterProcessor(
    new SimpleArrayFilterProcessor({ name: 'SimpleArrayFilter' })
  )

  // Register the exclude filter
  processor.addFilterProcessor(
    new SimpleArrayIgnoreFilterProcessor({ name: 'SimpleArrayIgnoreFilter' })
  )

  await fileProcessor.load('resources/demo.xlsx')
  processor.tables = fileProcessor.tables

  await processor.process()
}

main()
  .then(() => console.log('Done'))
  .catch(console.error)
```

The `name` parameter in the constructor must match the name used in the FilterSection of the spreadsheet. The default names are:

- `SimpleArrayFilter` for the include filter.
- `SimpleArrayIgnoreFilter` for the exclude filter.

You can also customize the delimiter:

```typescript
new SimpleArrayFilterProcessor({
  name: 'MyFilter',
  delimiter: ','  // Use comma instead of the default semicolon
})
```

## Combining Multiple Filters

You can define multiple rows in the FilterSection. When multiple filters are present, they are combined with AND logic: a test case is processed only if *all* filters return `true`.

| A         | B             | C                         | D | E              |
| --------- | ------------- | ------------------------- | - | -------------- |
| Filter    | FilterSection |                           |   |                |
|           |               | SimpleArrayFilter         |   | regression     |
|           |               | SimpleArrayIgnoreFilter   |   | slow           |

This configuration means: process test cases that have the "regression" tag AND do not have the "slow" tag. Given the earlier tag assignments:

- TC1 (smoke): excluded -- does not have "regression".
- TC2 (regression): included -- has "regression", does not have "slow".
- TC3 (smoke, regression): included -- has "regression", does not have "slow".
- TC4 (regression, slow): excluded -- has "regression" but also has "slow".

Only TC2 and TC3 would be processed.

## Creating a Custom Filter Processor

If the built-in filters do not meet your needs, you can create a custom filter processor by implementing the `FilterProcessorInterface`.

### The FilterProcessorInterface

```typescript
interface FilterProcessorInterface {
  /** The name used to reference this filter in the spreadsheet */
  name: string

  /** Evaluate tags against an expression. Return true to include the test case. */
  filter: (tags: string[], expression: string) => boolean
}
```

### Example: A Regex Filter

Here is a filter that treats the expression as a regular expression and includes test cases where at least one tag matches:

```typescript
import type { FilterProcessorInterface } from 'nanook-table'

export class RegexFilterProcessor implements FilterProcessorInterface {
  name: string

  constructor(opts: { name?: string } = {}) {
    this.name = opts.name ?? 'RegexFilter'
  }

  filter(tags: string[], expression: string): boolean {
    const regex = new RegExp(expression)
    return tags.some(tag => regex.test(tag))
  }
}
```

Usage in the spreadsheet:

| A         | B             | C           | D | E           |
| --------- | ------------- | ----------- | - | ----------- |
| Filter    | FilterSection |             |   |             |
|           |               | RegexFilter |   | ^smoke.*    |

This would include any test case that has a tag starting with "smoke" (e.g., "smoke", "smokeTest", "smoke-login").

Register it just like the built-in filters:

```typescript
processor.addFilterProcessor(
  new RegexFilterProcessor({ name: 'RegexFilter' })
)
```

### Example: A Priority Filter

Here is a filter that assigns numeric priority levels to tags and includes only test cases above a threshold:

```typescript
import type { FilterProcessorInterface } from 'nanook-table'

const PRIORITY_MAP: Record<string, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25
}

export class PriorityFilterProcessor implements FilterProcessorInterface {
  name: string

  constructor(opts: { name?: string } = {}) {
    this.name = opts.name ?? 'PriorityFilter'
  }

  filter(tags: string[], expression: string): boolean {
    const threshold = parseInt(expression, 10)
    if (isNaN(threshold)) return true

    // Find the highest priority among all tags
    let maxPriority = 0
    for (const tag of tags) {
      const priority = PRIORITY_MAP[tag]
      if (priority !== undefined && priority > maxPriority) {
        maxPriority = priority
      }
    }

    return maxPriority >= threshold
  }
}
```

Usage in the spreadsheet with expression `50` (include only test cases with priority "medium" or higher):

| A         | B             | C              | D | E  |
| --------- | ------------- | -------------- | - | -- |
| Filter    | FilterSection |                |   |    |
|           |               | PriorityFilter |   | 50 |

Tags in the TagSection would be priority labels like "critical", "high", "medium", "low".

## Best Practices

- **Keep tags simple and consistent.** Use lowercase, single-word tags. Avoid spaces in tag names.
- **Use include filters to run subsets.** During development, filter to just "smoke" or "critical" tests for fast feedback.
- **Use exclude filters to skip known issues.** Tag flaky or slow tests and exclude them from CI until they are fixed.
- **Combine filters for precision.** AND logic lets you express requirements like "regression tests that are not slow".
- **Name your filters clearly.** The filter name in the spreadsheet must exactly match the registered name. Mismatches are logged as errors and the filter is ignored.

## Summary

In this tutorial you learned how to:

1. Add TagSection and FilterSection to a decision table to control which test cases are processed.
2. Use `SimpleArrayFilterProcessor` to include test cases by tag.
3. Use `SimpleArrayIgnoreFilterProcessor` to exclude test cases by tag.
4. Register filter processors with `processor.addFilterProcessor()`.
5. Combine multiple filters with AND logic.
6. Implement the `FilterProcessorInterface` to create custom filtering logic.
