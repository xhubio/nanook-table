import { BaseSectionDefinition } from './BaseSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents the summary section in a decision table.
 *
 * The SummarySectionDefinition stores calculation results for the table, such as:
 * - The total number of test combinations.
 * - The number of completed test combinations.
 * - The percentage of test combinations that are done.
 *
 * As a summary section, it must exist only once in a model and does not support adding
 * additional data rows (it always uses the header row as its sole row).
 */
export class SummarySectionDefinition extends BaseSectionDefinition {
  /**
   * The section type is set to SUMMARY_SECTION.
   */
  sectionType = SectionType.SUMMARY_SECTION

  /**
   * The total number of test combinations.
   */
  total?: number = undefined

  /**
   * The number of test combinations that are completed.
   */
  done?: number = undefined

  /**
   * The percentage of completed test combinations.
   */
  percent?: number = undefined

  /**
   * Summary sections are not mandatory.
   */
  mandatory = false

  /**
   * Only one instance of a summary section is allowed in a model.
   */
  multiInstancesAllowed = false

  /**
   * Getter for the data row IDs of this section.
   * For a summary section, this returns the underlying data rows stored in the base class.
   *
   * @returns An array of row IDs.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs of this section.
   *
   * @param value - An array of row IDs to set.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Attempts to create a new data row for this section.
   *
   * Since the summary section is a single row section and should not have additional rows,
   * this method always returns undefined.
   *
   * @returns Always returns undefined.
   */
  createDataRow(): undefined {
    return undefined
  }

  /**
   * Retrieves all row IDs associated with this section.
   *
   * For a summary section, only the header row ID is used.
   *
   * @returns An array containing just the header row ID.
   */
  getRowIds() {
    return [this.headerRow]
  }
}
