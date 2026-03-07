import type { FilterProcessorInterface } from './FilterProcessorInterface.js'

/**
 * Options for initializing a SimpleArrayIgnoreFilterProcessor.
 */
export interface SimpleArrayIgnoreFilterProcessorOptions {
  /**
   * The name of this filter processor.
   * Defaults to 'SimpleArrayIgnoreFilter' if not provided.
   */
  name?: string

  /**
   * The delimiter used to split the filter expression into tokens.
   * Defaults to ';' if not provided.
   */
  delimiter?: string
}

/**
 * A filter processor that excludes test cases based on a filter expression.
 *
 * This processor is used to filter out test cases in a decision table.
 * It is registered by name with the processor, and the decision table references
 * the filter by that name. When the filter is applied, the expression is split using
 * the specified delimiter. If any token is found in the test case's tags, the test case
 * is filtered out (i.e., the filter returns false). Otherwise, it returns true.
 */
export class SimpleArrayIgnoreFilterProcessor
  implements FilterProcessorInterface
{
  /**
   * The name of this filter processor.
   */
  name: string

  /**
   * The delimiter used to split the filter expression.
   */
  delimiter: string

  /**
   * Constructs a new SimpleArrayIgnoreFilterProcessor.
   *
   * @param opts - Options for configuring the filter processor, including the name and delimiter.
   */
  constructor(opts: SimpleArrayIgnoreFilterProcessorOptions = {}) {
    this.name = opts.name || 'SimpleArrayIgnoreFilter'
    this.delimiter = opts.delimiter || ';'
  }

  /**
   * Filters the test case tags using the provided expression.
   *
   * The expression is split into tokens using the configured delimiter.
   * If any token is present in the tags array, the filter returns false,
   * indicating that the test case should be excluded. If none of the tokens
   * are found in the tags, the filter returns true.
   *
   * @param tags - An array of tags associated with the test case.
   * @param expression - The filter expression containing tokens to ignore.
   * @returns True if none of the tokens are present in the tags; otherwise, false.
   */
  filter(tags: string[], expression: string): boolean {
    const expressions = expression.split(this.delimiter)

    for (let expr of expressions) {
      expr = expr.trim()
      if (expr !== '' && tags.includes(expr)) {
        return false
      }
    }

    return true
  }
}
