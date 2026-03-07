/**
 * Represents a filter used to select or exclude test cases.
 *
 * This interface defines the structure of a filter that can be applied
 * to test cases later in the process. A filter is characterized by a specific
 * filter processor, a filter expression, and optional comments.
 */
export interface FilterInterface {
  /**
   * The name of the filter processor.
   *
   * This identifies the engine or algorithm that will process the filter expression.
   */
  filterProcessorName: string

  /**
   * The filter expression.
   *
   * This expression is used to evaluate test cases and determine whether they should be included.
   */
  expression: string

  /**
   * Optional comments providing additional context or description about the filter.
   */
  comment?: string
}
