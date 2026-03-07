import type { FilterProcessorInterface } from './FilterProcessorInterface.js'

/**
 * Options for initializing a SimpleArrayFilterProcessor.
 */
export interface SimpleArrayFilterProcessorOptions {
  /**
   * The name of this filter processor.
   * Defaults to 'SimpleArrayFilter' if not provided.
   */
  name?: string

  /**
   * The delimiter used to split the filter expression into individual tokens.
   * Defaults to ';' if not provided.
   */
  delimiter?: string
}

/**
 * A filter processor that filters test cases based on an array of tags.
 *
 * This processor splits the provided filter expression using a delimiter and
 * checks if any of the tokens appear in the list of tags attached to a test case.
 * It is typically registered by name in the processor and referenced in the decision table.
 */
export class SimpleArrayFilterProcessor implements FilterProcessorInterface {
  /**
   * The name of this filter processor.
   */
  name: string

  /**
   * The delimiter used to split the filter expression.
   */
  delimiter: string

  /**
   * Constructs a new SimpleArrayFilterProcessor.
   *
   * @param opts - Options for configuring the filter processor, including the name and delimiter.
   */
  constructor(opts: SimpleArrayFilterProcessorOptions = {}) {
    this.name = opts.name || 'SimpleArrayFilter'
    this.delimiter = opts.delimiter || ';'
  }

  /**
   * Filters the given tags using the provided expression.
   *
   * The expression is split using the configured delimiter, and each token is trimmed.
   * If any token is non-empty and is found within the tags array, the function returns true.
   * Otherwise, it returns false.
   *
   * @param tags - An array of tags associated with a test case.
   * @param expression - A filter expression containing one or more tokens separated by the delimiter.
   * @returns True if at least one token in the expression is found in the tags array; otherwise, false.
   */
  filter(tags: string[], expression: string): boolean {
    const expressions = expression.split(this.delimiter)

    for (let expr of expressions) {
      expr = expr.trim()
      if (expr !== '' && tags.includes(expr)) {
        return true
      }
    }

    return false
  }
}
