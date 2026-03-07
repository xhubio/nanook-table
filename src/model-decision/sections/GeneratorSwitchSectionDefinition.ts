import { BaseSectionDefinition } from './BaseSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents a generator switch section in a decision table.
 *
 * This section is used to control the execution of generators via switches.
 * It stores the generator names, corresponding switch values, and optional comments.
 */
export class GeneratorSwitchSectionDefinition extends BaseSectionDefinition {
  /**
   * The section type, set to GENERATOR_SWITCH_SECTION.
   */
  sectionType = SectionType.GENERATOR_SWITCH_SECTION

  /**
   * Maps row IDs to generator names.
   */
  generatorNames: Record<string, string> = {}

  /**
   * Maps row IDs to switch values (expressions).
   */
  values: Record<string, string> = {}

  /**
   * Maps row IDs to comment entries.
   */
  comments: Record<string, string> = {}

  /**
   * Getter for the data row IDs of this section.
   * @returns An array containing the row IDs.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs of this section.
   * @param value - An array of row IDs.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Validates this generator switch section definition.
   *
   * Checks that each row in the section has an associated generator name.
   * If a row lacks a generator name, an error issue is added.
   *
   * @returns An array of validation issues found.
   */
  validate() {
    const issues = super.validate()

    // Helper object to check for duplicate generator names.
    const helper: Record<string, string> = {}

    this.dataRows.forEach((rowId) => {
      if (this.generatorNames[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The generatorNames field must exist for each row',
          rowId,
          level: 'ERROR'
        })
      } else {
        helper[this.generatorNames[rowId]] = rowId
      }
    })

    return issues
  }
}
