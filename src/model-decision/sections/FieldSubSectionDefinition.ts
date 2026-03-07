import {
  BaseSectionDefinition,
  BaseSectionDefinitionOptions
} from './BaseSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Options for initializing a FieldSubSectionDefinition.
 */
export interface FieldSubSectionDefinitionOptions
  extends BaseSectionDefinitionOptions {
  /**
   * Indicates if the data generator (tdg) column is mandatory.
   * Default is false.
   */
  tdgMandatory?: boolean

  /**
   * Indicates if the sub-section must have at least one value.
   * Default is true.
   */
  mandatory?: boolean

  /**
   * The ID of the parent section.
   */
  parent: string
}

/**
 * Represents a sub-section within a FieldSectionDefinition.
 *
 * A FieldSubSectionDefinition defines the details for a specific field,
 * including its equivalence class entries, comments, and data generator (tdg) values.
 */
export class FieldSubSectionDefinition extends BaseSectionDefinition {
  /**
   * The section type is set to FIELD_SUB_SECTION.
   */
  sectionType = SectionType.FIELD_SUB_SECTION

  /**
   * Stores the equivalence class entries indexed by their row ID.
   */
  equivalenceClasses: Record<string, string> = {}

  /**
   * Stores the comments indexed by their row ID.
   */
  comments: Record<string, string> = {}

  /**
   * Stores the data generator (tdg) entries indexed by their row ID.
   */
  tdgs: Record<string, string> = {}

  /**
   * Indicates if the data generator column is mandatory.
   * Default is false.
   */
  tdgMandatory: boolean = false

  /**
   * The ID of the parent section.
   */
  parent: string

  /**
   * Getter for the data row IDs of this sub-section.
   * @returns An array of row IDs.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs of this sub-section.
   * @param value - The new array of row IDs.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Constructs a new FieldSubSectionDefinition.
   *
   * Initializes the sub-section with the specified parent section ID, and configures
   * whether the sub-section is mandatory and if the tdg field is mandatory.
   *
   * @param opts - Options for initializing the FieldSubSectionDefinition.
   */
  constructor(opts: FieldSubSectionDefinitionOptions) {
    super(opts)
    this.parent = opts.parent

    if (opts.mandatory !== undefined) {
      this.mandatory = opts.mandatory
    } else {
      this.mandatory = true
    }

    if (opts.tdgMandatory !== undefined) {
      this.tdgMandatory = opts.tdgMandatory
    }
  }

  /**
   * Validates this sub-section definition.
   *
   * Validation rules:
   * - If tdgMandatory is true, each row must have a defined tdg value.
   * - Each row must have a defined equivalence class value.
   * - Equivalence class values must be unique within the sub-section.
   *
   * @returns An array of validation issues found.
   */
  validate() {
    const issues = super.validate()

    // Helper object to track equivalence class values for uniqueness.
    const helper: Record<string, string> = {}

    // Validate each row in this sub-section.
    this.dataRows.forEach((rowId) => {
      // Check for mandatory tdg value.
      if (this.tdgMandatory && this.tdgs[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The tdg fields must must not be empty',
          rowId,
          level: 'ERROR'
        })
      }

      // Check that an equivalence class value is provided.
      if (this.equivalenceClasses[rowId] === undefined) {
        issues.push({
          section: this,
          type: 'definition',
          message: 'The equivalenceClasses fields must must not be empty',
          rowId,
          level: 'ERROR'
        })
      } else if (helper[this.equivalenceClasses[rowId]] !== undefined) {
        // If the equivalence class value is duplicated, report a warning.
        issues.push({
          section: this,
          type: 'definition',
          message: `The key value '${this.equivalenceClasses[rowId]}' is double to line '${helper[this.equivalenceClasses[rowId]]}'`,
          rowId,
          level: 'WARNING'
        })
      } else {
        helper[this.equivalenceClasses[rowId]] = rowId
      }
    })

    return issues
  }
}
