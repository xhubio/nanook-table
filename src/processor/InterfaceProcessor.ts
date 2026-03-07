import type { TableInterface } from '../model/index.js'

/**
 * Defines the public API for an InterfaceProcessor.
 *
 * An InterfaceProcessor is responsible for managing and processing tables.
 * It supports adding tables, clearing loaded tables and generator data, and processing
 * all the tables asynchronously.
 */
export interface InterfaceProcessor {
  /**
   * Adds the provided list of tables to the processor.
   *
   * @param tables - An array of TableInterface objects representing the tables to be added.
   */
  addTables(tables: TableInterface[]): void

  /**
   * Clears all loaded tables and generator data from the processor.
   *
   * This method is used to reset the processor state by deleting any loaded tables
   * and associated data.
   */
  clear(): void

  /**
   * Processes all the tables currently loaded in the processor.
   *
   * This method is asynchronous and returns a promise that resolves once all tables
   * have been processed. Derived classes must implement the actual processing logic.
   *
   * @returns A promise that resolves when processing is complete.
   */
  process(): Promise<void>
}
