import type { TableInterface } from './TableInterface.js'
import type { FilterInterface } from './FilterInterface.js'
import type { TestcaseDirectivesInterface } from './TestcaseDirectivesInterface.js'
import type { MetaTestcase } from './MetaInterface.js'
import type { LoggerInterface } from '../logger/LoggerInterface.js'

/**
 * Represents the definition of a test case, including its metadata, execution parameters,
 * and functions to generate related data (such as tags, filters, and directives).
 *
 * This interface encapsulates the information and behavior required to create and manage
 * test case data within a table context.
 */
export interface TestcaseDefinitionInterface {
  /**
   * Logger instance used for logging information related to the test case.
   */
  logger: LoggerInterface

  /**
   * Unique identifier for this test case.
   */
  id: string

  /**
   * Read-only meta-information for this test case.
   * Contains details inherited from the table (e.g., test case name).
   */
  readonly testcaseMeta: MetaTestcase

  /**
   * Specifies how many times this test case should be generated.
   * Must be an integer greater than 0.
   */
  multiplicity: number

  /**
   * Indicates whether this test case should be executed.
   * If false, the test case serves only as a reference.
   */
  execute: boolean

  /**
   * When true, indicates that this test case should not be executed if a referenced
   * test case has this flag set.
   */
  neverExecute: boolean

  /**
   * Data associated with this test case.
   *
   * In a decision table, a test case represents a column where all data in that column
   * is identified by a unique row value. In a matrix table, this property typically holds a single value.
   */
  data?: any // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Back reference to the table that contains this test case.
   */
  table: TableInterface

  /**
   * Generates and returns all tags associated with this test case.
   *
   * @returns An array of tags (strings) derived from the test case data.
   */
  createTags: () => string[]

  /**
   * Generates and returns all filters associated with this test case.
   *
   * @returns An array of FilterInterface objects representing the filters.
   */
  createFilter: () => FilterInterface[]

  /**
   * Returns a list of generator names that should be skipped during test execution.
   *
   * @returns An array of generator names as strings.
   */
  createGeneratorSwitches: () => string[]

  /**
   * Creates and returns all directives associated with this test case definition.
   *
   * Directives define the processing or data generation tasks for this test case.
   *
   * @returns An object conforming to TestcaseDirectivesInterface.
   */
  createDirectives: () => TestcaseDirectivesInterface
}
