import type { TestcaseDefinitionInterface } from './TestcaseDefinitionInterface.js'
import type { MetaTable } from './MetaInterface.js'
import type { LoggerInterface } from '../logger/LoggerInterface.js'

/**
 * Represents the abstract definition of a table.
 * This can include various types of tables such as decision tables, matrix tables, etc.
 */
export interface TableInterface {
  /**
   * The file name from which the table is loaded.
   */
  fileName: string

  /**
   * The human-readable name of the table.
   */
  tableName: string

  /**
   * Logger instance used for logging operations related to the table.
   */
  logger: LoggerInterface

  /**
   * Read-only meta information about the table.
   */
  readonly tableMeta: MetaTable

  /**
   * A string identifier representing the type of table (e.g., 'decision-table').
   */
  readonly tableType: string

  /**
   * Retrieves the test case definition for a given test case name.
   *
   * @param testcaseName - The name of the test case to retrieve.
   * @returns The test case definition corresponding to the provided name.
   * @throws An error if the test case cannot be found.
   */
  getTestcaseForName: (testcaseName: string) => TestcaseDefinitionInterface

  /**
   * A generator function that yields all test cases intended for execution.
   *
   * @returns A generator yielding test case definitions.
   */
  getTestcasesForExecution(): Generator<
    TestcaseDefinitionInterface,
    void,
    unknown
  >

  /**
   * Parses a test case name or range and returns an array of individual test case names.
   *
   * For example, a range name such as "tc12-14" is expanded to:
   * ["tc12", "tc13", "tc14"].
   *
   * @param rangeName - The test case name or range to parse.
   * @returns An array of test case names.
   */
  processRanges: (rangeName: string) => string[]
}
