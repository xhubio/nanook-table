import { BaseSectionDefinition } from './BaseSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents a filter section definition in a decision table.
 *
 * This section is used to specify filtering criteria that determine which test cases
 * are created from the table data. It holds the names of filter processors, the corresponding
 * filter expressions, and optional comments for each row in the section.
 */
export class FilterSectionDefinition extends BaseSectionDefinition {
  /**
   * The section type, set to FILTER_SECTION.
   */
  sectionType = SectionType.FILTER_SECTION

  /**
   * Maps row IDs to the names of the filter processors.
   */
  filterProcessorNames: Record<string, string> = {}

  /**
   * Maps row IDs to the filter expressions.
   */
  expressions: Record<string, string> = {}

  /**
   * Maps row IDs to comment entries.
   */
  comments: Record<string, string> = {}

  /**
   * Getter for the data row IDs of this filter section.
   * @returns An array containing the row IDs.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs of this filter section.
   * @param value - An array of row IDs.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Validates this filter section definition.
   *
   * The validation checks that:
   * - Every row in the section has a defined filter processor name.
   * - Every row in the section has a defined filter expression.
   * Additionally, it tracks filter processor names to ensure uniqueness.
   *
   * @returns An array of validation issues found (if any).
   */
  validate() {
    const issues = super.validate()

    // Helper object to track filter processor names for uniqueness.
    const helper: Record<string, string> = {}

    // Validate each row in the section.
    this.dataRows.forEach((rowId) => {
      if (this.filterProcessorNames[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The filterProcessorNames field must exist for each row',
          rowId,
          level: 'ERROR'
        })
      } else if (this.expressions[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The expressions field must exist for each row',
          rowId,
          level: 'ERROR'
        })
      } else {
        helper[this.filterProcessorNames[rowId]] = rowId
      }
    })

    return issues
  }
}
