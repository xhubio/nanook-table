import { v4 as uuidv4 } from 'uuid'
import type { TestcaseDataInterface } from './TestcaseDataInterface.js'
import type { CallTreeInterface } from './CallTreeInterface.js'
import type { GeneratorDirectiveInterface } from '../model/index.js'

/**
 * Options for initializing a TestcaseData instance.
 */
export interface TestcaseDataOption {
  /**
   * The name of the table from which this test case receives data.
   * For the table that creates the test case, this is considered to be at position '0'.
   */
  tableName: string

  /**
   * The name of the test case as created in the issuing table.
   */
  name: string

  /**
   * The main instance ID of this test case data.
   * If not provided, a new UUID will be generated.
   */
  instanceId?: string

  /**
   * The call tree representing the order in which the test data was generated.
   */
  callTree: CallTreeInterface
}

/**
 * Represents the data for a test case.
 *
 * The TestcaseData class stores data contributed by multiple tables.
 * Each table's data is stored under its table name, allowing for easy retrieval and manipulation.
 * In addition, the class maintains metadata about the test case, such as its name, instance ID, and call tree.
 * It also stores generator todos for postprocessing.
 */
export class TestcaseData implements TestcaseDataInterface {
  /**
   * The name of the table that provides data for this test case.
   * For the table that issues the test case, this is at position '0'.
   */
  tableName: string

  /**
   * The name of the test case as created in the issuing table.
   */
  name: string

  /**
   * The test case data.
   *
   * Data is stored in a nested structure where each table's data is keyed by the table name.
   * For example, data[tableName] returns the data object associated with that table.
   */
  data: Record<string, any> = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * The main instance ID for this test case data.
   */
  instanceId: string

  /**
   * The call tree that shows the sequence of data generation steps for this test case.
   */
  callTree: CallTreeInterface

  /**
   * Stores the generator directives for postprocessing.
   *
   * After the initial generation of test case data, these directives are used to perform additional processing.
   */
  postProcessDirectives: GeneratorDirectiveInterface[] = []

  /**
   * Constructs a new TestcaseData instance.
   *
   * @param opts - Options for initializing the test case data, including the table name, test case name,
   * the call tree representing the data generation order, and an optional instance ID.
   * If the instance ID is not provided, a new UUID is generated.
   */
  constructor(opts: TestcaseDataOption) {
    this.tableName = opts.tableName
    this.name = opts.name
    this.callTree = opts.callTree

    // Set the instanceId; generate a new one if not provided.
    this.instanceId = opts.instanceId || uuidv4()
  }
}
