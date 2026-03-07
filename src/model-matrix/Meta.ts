import type { MetaTestcase } from '../model/index.js'

/**
 * Represents the meta information for a row or column in a matrix table.
 *
 * This interface contains properties that describe a row or column, including its name,
 * execution flag, position identifier, associated generator, and an optional description.
 */
export interface MetaRowColumn {
  /**
   * The name of the row or column.
   */
  name: string

  /**
   * The short name of the row or column.
   */
  shortName: string

  /**
   * Indicates whether all combinations for this row or column should be executed.
   */
  execute: boolean

  /**
   * A unique position identifier used to reference this row or column.
   */
  position: string

  /**
   * The name of the generator used to create data for this row or column.
   */
  generator: string

  /**
   * An optional description providing additional details.
   */
  description?: string
}

/**
 * Extends MetaTestcase with additional meta information specific to matrix tables.
 *
 * This interface combines the standard test case meta information with the meta data for
 * both the row and the column that define the test case.
 */
export interface MetaTestcaseMatrix extends MetaTestcase {
  /**
   * Meta information for the row associated with this test case.
   */
  row: MetaRowColumn

  /**
   * Meta information for the column associated with this test case.
   */
  column: MetaRowColumn
}
