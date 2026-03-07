import { v4 as uuidv4 } from 'uuid'
import {
  SectionErrorInterface,
  SectionInterface
} from '../interface/SectionInterface.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Options for initializing a BaseSectionDefinition.
 */
export interface BaseSectionDefinitionOptions {
  /**
   * The name of this section.
   */
  name?: string

  /**
   * An identifier used to identify the header row of the section.
   * (FIXME: Consider renaming to headerRowId)
   */
  headerRow?: string
}

/**
 * Base class for all sections used in a decision table.
 *
 * A decision table is divided into different sections, each providing specific functionality.
 * This base class implements common properties and methods shared by all sections.
 */
export class BaseSectionDefinition implements SectionInterface {
  /**
   * The type of the section.
   * Subclasses should override this property.
   */
  sectionType = SectionType.BASE_SECTION

  /**
   * The name of this section.
   */
  name?: string

  /**
   * Indicates whether the section is mandatory (i.e., must have at least one value).
   */
  mandatory = false

  /**
   * Indicates whether the section supports multiple data rows.
   */
  multiple = true

  /**
   * The identifier for the header row of the section.
   * (FIXME: Consider renaming to headerRowId)
   */
  headerRow: string = uuidv4()

  /**
   * Stores the IDs of the data rows for this section.
   */
  protected _dataRows: string[] = [] // eslint-disable-line @typescript-eslint/naming-convention

  /**
   * If set to false, only one instance of this section type is allowed per model.
   */
  multiInstancesAllowed = true

  /**
   * Constructs a new BaseSectionDefinition.
   *
   * @param opts - Options for initializing the section, including an optional name and header row identifier.
   */
  constructor(opts: BaseSectionDefinitionOptions) {
    if (opts.name !== undefined) {
      this.name = opts.name
    }
    if (opts.headerRow !== undefined) {
      this.headerRow = opts.headerRow
    }
  }

  /**
   * Gets the data row IDs for this section.
   *
   * @returns An array containing the IDs of the data rows.
   */
  public get dataRows(): string[] {
    return this._dataRows
  }

  /**
   * Sets the data row IDs for this section.
   *
   * @param value - The new array of data row IDs.
   */
  public set dataRows(value: string[]) {
    this._dataRows = value
  }

  /**
   * Determines if a given row ID corresponds to the header row.
   *
   * @param rowid - The row ID to check.
   * @returns True if the provided row ID is the header row; otherwise, false.
   */
  isHeader(rowid: string) {
    return this.headerRow === rowid
  }

  /**
   * Creates a new data row for this section.
   *
   * If the section supports multiple rows, a new UUID is generated, added to the
   * data rows array, and returned.
   *
   * @returns The newly created row ID.
   * @throws Error if the section does not support multiple rows.
   */
  createNewRow() {
    if (this.multiple) {
      const id = uuidv4()
      this.dataRows.push(id)
      return id
    }
    throw new Error('This section could not have any data row')
  }

  /**
   * Retrieves all row IDs associated with this section.
   *
   * If the section supports multiple rows, returns an array containing the header row and all data rows.
   * Otherwise, returns an array containing only the header row.
   *
   * @returns An array of row IDs.
   */
  getRowIds() {
    if (this.multiple) {
      return [this.headerRow, ...this.dataRows]
    }
    return [this.headerRow]
  }

  /**
   * Validates the section definition.
   *
   * Currently, validation checks that the section has a defined name.
   *
   * @returns An array of validation issues, each conforming to SectionErrorInterface.
   */
  validate() {
    const issues: SectionErrorInterface[] = []
    if (this.name === undefined) {
      const issue: SectionErrorInterface = {
        section: this,
        type: 'definition',
        message: 'The section has no name',
        level: 'ERROR'
      }
      issues.push(issue)
    }
    return issues
  }
}
