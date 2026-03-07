import type { GeneratorDirectiveInterface } from '../model/index.js'
import type { CallTreeInterface } from './CallTreeInterface.js'

/**
 * Represents the data structure for a test case.
 *
 * Each test case includes:
 * - The table name from which data is received (with the originating table at position '0').
 * - The test case name as issued by the originating table.
 * - A data object that aggregates data from various tables, keyed by table name.
 * - A unique instance ID.
 * - A call tree representing the order in which the test data was generated.
 * - A collection of generator directives for postprocessing.
 */
export interface TestcaseDataInterface {
  /**
   * The name of the table that provided data for this test case.
   * The table that creates the test case is at position '0'.
   */
  tableName: string

  /**
   * The name of the test case, as created in the issuing table.
   */
  name: string

  /**
   * The test case data.
   * Data from each contributing table is stored under the table's name.
   */
  data: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * The unique instance ID for this test case data.
   */
  instanceId: string

  /**
   * The call tree showing the sequence of data generation for this test case.
   */
  callTree: CallTreeInterface

  /**
   * Stores the generator directives for postprocessing.
   *
   * After the initial test case data is generated, these directives are processed
   * a second time to perform additional data manipulations.
   */
  postProcessDirectives: GeneratorDirectiveInterface[]
}
