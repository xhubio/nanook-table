/**
 * Represents a node in the call tree structure used for managing test case execution.
 *
 * Each node contains:
 * - An array of tags that can be used for filtering or categorization.
 * - A list of child nodes to represent hierarchical relationships.
 * - A flag indicating if the test case should never be executed.
 * - A unique instance identifier.
 * - The name of the table and test case associated with this node.
 */
export interface CallTreeInterface {
  /**
   * An array of tags associated with this call tree node.
   */
  tags: string[]

  /**
   * An array of child nodes in the call tree.
   */
  children: CallTreeInterface[]

  /**
   * Indicates whether the test case associated with this node should never be executed.
   */
  neverExecute: boolean

  /**
   * A unique identifier for this test data instance.
   */
  instanceId: string

  /**
   * The name of the table to which this test case belongs.
   */
  tableName: string

  /**
   * The name of the test case associated with this node.
   */
  testcaseName: string
}
