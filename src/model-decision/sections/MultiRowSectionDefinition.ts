import { BaseSectionDefinition } from './BaseSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents a multi-row section in a decision table.
 *
 * This section does not enforce any specific functionality on its own;
 * its primary role is to transfer data into the test case data model.
 * It is commonly used to add extra attributes or metadata to test cases.
 */
export class MultiRowSectionDefinition extends BaseSectionDefinition {
  /**
   * The section type is set to MULTI_ROW_SECTION.
   */
  sectionType = SectionType.MULTI_ROW_SECTION

  /**
   * Maps row IDs to 'key' entries.
   */
  keys: Record<string, string> = {}

  /**
   * Maps row IDs to 'comment' entries.
   */
  comments: Record<string, string> = {}

  /**
   * Maps row IDs to 'other' entries.
   */
  others: Record<string, string> = {}

  /**
   * Getter for the data row IDs of this section.
   * @returns An array of row IDs stored in the section.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs of this section.
   * @param value - An array of row IDs to set.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Validates the multi-row section definition.
   *
   * The validation checks that:
   * - Each row has an associated 'key' value.
   * - The 'key' values are unique within the section.
   *
   * @returns An array of validation issues found, each conforming to SectionErrorInterface.
   */
  validate() {
    const issues = super.validate()

    // Helper object to track key values for uniqueness.
    const helper: Record<string, string> = {}

    // Iterate over each row in the section.
    this.dataRows.forEach((rowId) => {
      if (this.keys[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The key fields must exist',
          rowId,
          level: 'ERROR'
        })
      } else if (helper[this.keys[rowId]] !== undefined) {
        // A duplicate key is detected.
        issues.push({
          section: this,
          type: 'definition',
          message: `The key value '${this.keys[rowId]}' is duplicated with row '${helper[this.keys[rowId]]}'`,
          rowId,
          level: 'WARNING'
        })
      } else {
        helper[this.keys[rowId]] = rowId
      }
    })

    return issues
  }
}
