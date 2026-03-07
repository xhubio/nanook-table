import type { LoggerInterface } from '../logger/index.js'
import type { TestcaseDataInterface } from './TestcaseDataInterface.js'

/**
 * Defines the interface for a writer used by the processor to output test case data.
 *
 * An InterfaceWriter is responsible for handling the output process and typically
 * performs three main operations: actions to execute before processing any test cases,
 * writing the test case data during processing, and actions to execute after processing all test cases.
 */
export interface InterfaceWriter {
  /**
   * Logger instance used for logging writer operations.
   */
  logger: LoggerInterface

  /**
   * Method called before the first test case is processed.
   *
   * This method allows the writer to perform any necessary initialization or setup tasks.
   *
   * @returns A promise that resolves when the initialization is complete.
   */
  before(): Promise<void>

  /**
   * Writes the test case data.
   *
   * This method is called for writing or exporting the test case data contained in the TestcaseDataInterface.
   *
   * @param testcaseData - The TestcaseData object containing all processed test case data.
   * @returns A promise that resolves when the writing operation is complete.
   */
  write(testcaseData: TestcaseDataInterface): Promise<void>

  /**
   * Method called after the last test case has been processed.
   *
   * This method allows the writer to perform any cleanup or finalization tasks.
   *
   * @returns A promise that resolves when all finalization tasks are complete.
   */
  after(): Promise<void>
}
