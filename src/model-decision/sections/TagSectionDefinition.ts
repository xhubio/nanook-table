import { BaseSectionDefinition } from './BaseSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents a tag section in a decision table.
 *
 * This section allows users to assign labels (tags) to test cases. These tags can later be used
 * to filter test cases in conjunction with a FilterSection.
 */
export class TagSectionDefinition extends BaseSectionDefinition {
  /**
   * The section type is set to TAG_SECTION.
   */
  sectionType = SectionType.TAG_SECTION

  /**
   * Maps row IDs to their corresponding tag entries.
   */
  tags: Record<string, string> = {}

  /**
   * Maps row IDs to comment entries associated with the tags.
   */
  comments: Record<string, string> = {}

  /**
   * Maps row IDs to additional information entries.
   */
  others: Record<string, string> = {}

  /**
   * Getter for the data row IDs for this section.
   * @returns An array of row IDs.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs for this section.
   * @param value - An array of row IDs.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Validates the tag section definition.
   *
   * This method checks that every row in the section has an associated tag.
   * It also ensures that the tag values are unique. If a row is missing a tag,
   * an error issue is reported. Duplicate tag values are reported as warnings.
   *
   * @returns An array of validation issues found.
   */
  validate() {
    const issues = super.validate()

    // Helper object to track tag values for uniqueness.
    const helper: Record<string, string> = {}

    this.dataRows.forEach((rowId) => {
      if (this.tags[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The tag field must exist for each row',
          rowId,
          level: 'ERROR'
        })
      } else if (helper[this.tags[rowId]] !== undefined) {
        // Duplicate tag detected.
        issues.push({
          section: this,
          type: 'definition',
          message: `The tag value '${this.tags[rowId]}' is duplicated with row '${helper[this.tags[rowId]]}'`,
          rowId,
          level: 'WARNING'
        })
      } else {
        helper[this.tags[rowId]] = rowId
      }
    })

    return issues
  }
}
