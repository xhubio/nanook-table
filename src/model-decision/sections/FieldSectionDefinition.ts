import {
  BaseSectionDefinition,
  BaseSectionDefinitionOptions
} from './BaseSectionDefinition.js'
import { FieldSubSectionDefinition } from './FieldSubSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Options for initializing a FieldSectionDefinition.
 */
export interface FieldSectionDefinitionOptions
  extends BaseSectionDefinitionOptions {
  /**
   * Indicates if the data generator (tdg) column is mandatory.
   * Default is false.
   */
  tdgMandatory?: boolean

  /**
   * Indicates if the section must have at least one value.
   * Default is true.
   */
  mandatory?: boolean
}

/**
 * Represents the main data section of a decision table.
 *
 * A FieldSectionDefinition is the most important section in a decision table,
 * as it contains the relevant data divided into one or more sub-sections.
 * Each sub-section is represented by a FieldSubSectionDefinition and is stored
 * in the 'subSections' mapping using its header row as the key.
 */
export class FieldSectionDefinition extends BaseSectionDefinition {
  /**
   * The section type is set to FIELD_SECTION.
   */
  sectionType = SectionType.FIELD_SECTION

  /**
   * A mapping of sub-section IDs to their corresponding FieldSubSectionDefinition.
   */
  subSections: Record<string, FieldSubSectionDefinition> = {}

  /**
   * Indicates whether the data generator (tdg) column is mandatory.
   * Default is false.
   */
  tdgMandatory: boolean = false

  /**
   * Indicates whether the section must have at least one value.
   * Default is true.
   */
  mandatory: boolean = true

  /**
   * Getter for the data row IDs of this section.
   * Returns the underlying _dataRows array.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Setter for the data row IDs of this section.
   * Updates the underlying _dataRows array.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Constructs a new FieldSectionDefinition.
   *
   * Initializes the field section with options provided, including whether the section is mandatory
   * and whether the data generator column is mandatory.
   *
   * @param opts - Options for initializing the field section.
   */
  constructor(opts: FieldSectionDefinitionOptions) {
    super(opts)

    if (opts.mandatory !== undefined) {
      this.mandatory = opts.mandatory
    }
    if (opts.tdgMandatory !== undefined) {
      this.tdgMandatory = opts.tdgMandatory
    }
  }

  /**
   * Validates the field section definition.
   *
   * This method checks that the section has at least one sub-section.
   * If no sub-sections exist, an error issue is added to the returned array.
   * Otherwise, it iterates over each sub-section and invokes its validate method.
   *
   * @returns An array of validation issues found.
   */
  validate() {
    const issues = super.validate()

    if (this.dataRows.length === 0) {
      issues.push({
        section: this,
        type: 'definition',
        message: 'A fieldSection needs at least one sub section',
        level: 'ERROR'
      })
    } else {
      // Validate each sub-section.
      this.dataRows.forEach((rowId) => {
        const subSectionDefinition = this.subSections[rowId]
        subSectionDefinition.validate()
      })
    }
    return issues
  }

  /**
   * Creates a new data row for this field section.
   *
   * Since a field section contains sub-sections, this method creates a new field by calling createNewField
   * and returns the header row ID of the newly created sub-section.
   *
   * @returns The header row ID of the newly created field.
   */
  createNewRow(): string {
    return this.createNewField().headerRow
  }

  /**
   * Adds a new empty field to the section.
   *
   * This method creates a new FieldSubSectionDefinition with an optional field name,
   * assigns the header row of the new field as its identifier, adds it to the subSections mapping,
   * and appends its header row to the dataRows array. It also sets the parent of the sub-section to the
   * header row of the field section.
   *
   * @param fieldName - (Optional) The name for the new field.
   * @returns The newly created FieldSubSectionDefinition.
   */
  createNewField(fieldName?: string): FieldSubSectionDefinition {
    const field = new FieldSubSectionDefinition({
      name: fieldName,
      parent: this.headerRow
    })
    const id = field.headerRow
    this.subSections[id] = field
    this.dataRows.push(id)
    field.parent = this.headerRow
    return field
  }
}
