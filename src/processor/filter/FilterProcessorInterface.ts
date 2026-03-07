/**
 * Represents a filter processor used to filter generated test cases based on tags.
 */
export interface FilterProcessorInterface {
  /**
   * The name of the filter processor.
   */
  name: string

  /**
   * Filters an array of tags using the provided expression.
   *
   * The method evaluates the given expression against the list of tags
   * and returns true if the filter criteria are met.
   *
   * @param tags - An array containing all the tags associated with a test case.
   * @param expression - A filter expression to evaluate the tags.
   * @returns True if the filter criteria are satisfied; otherwise, false.
   */
  filter: (tags: string[], expression: string) => boolean
}
