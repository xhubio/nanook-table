import { TestcaseDefinitionInterface } from '../../model/index.js'
import { SectionType } from '../sections/SectionTypeEnum.js'

/**
 * Interface defining the structure and behavior of a section in a decision table.
 *
 * A decision table is divided into various sections, each providing different functionalities.
 * This interface specifies common properties and methods that all section implementations must have.
 */
export interface SectionInterface {
  /**
   * The type of the section.
   * This should be overwritten by subclasses to specify the actual section type.
   */
  sectionType: SectionType

  /**
   * The name of this section.
   */
  name?: string

  /**
   * Indicates whether the section must have at least one value.
   */
  mandatory: boolean

  /**
   * Indicates whether the section may have more than one row.
   */
  multiple: boolean

  /**
   * The identifier used to identify the header row of the section.
   * (FIXME: Consider renaming this to headerRowId)
   */
  headerRow: string

  /**
   * An array storing the IDs of the data rows in this section.
   */
  dataRows: string[]

  /**
   * If set to false, only one instance of this section type is allowed per model.
   */
  multiInstancesAllowed: boolean

  /**
   * Determines if the provided row ID corresponds to the header row.
   * @param rowId - The row ID to check.
   * @returns True if the row ID is the header row, false otherwise.
   */
  isHeader: (rowId: string) => boolean

  /**
   * Creates a new row for this section.
   * Generates a new UUID and adds it to the row array.
   * @returns The new row ID, or undefined if no row is created.
   */
  createNewRow: () => string | undefined

  /**
   * Retrieves all row IDs associated with this section.
   * @returns An array of row IDs.
   */
  getRowIds: () => string[]

  /**
   * Validates the section definition.
   * Checks that required properties, such as the section name, are defined.
   * @returns An array of issues found during validation.
   */
  validate: () => SectionErrorInterface[]
}

/**
 * Interface representing a validation error for a section.
 *
 * This error interface captures details about issues found during the validation of a section definition.
 */
export interface SectionErrorInterface {
  /**
   * The section where the error occurred.
   */
  section?: SectionInterface

  /**
   * The test case related to the error, if applicable.
   */
  testCase?: TestcaseDefinitionInterface

  /**
   * The name of the table associated with the error.
   */
  tableName?: string

  /**
   * The type of the error.
   */
  type: string

  /**
   * A descriptive error message.
   */
  message: string

  /**
   * The log level for the error.
   * (FIXME: Consider replacing this string with an enum for log levels.)
   */
  level: string

  /**
   * The row ID that caused the error, if applicable.
   */
  rowId?: string

  /**
   * The column ID that caused the error, if applicable.
   */
  column?: string
}
