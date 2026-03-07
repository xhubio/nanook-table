import { BaseSectionDefinition } from './BaseSectionDefinition.js'

/**
 * Represents a single row section in a decision table.
 *
 * A single row section consists of only one row. All single row sections should extend from this class.
 * This class overrides the properties and methods to enforce that only the header row is used as the data row.
 */
export class BaseSingleRowSectionDefinition extends BaseSectionDefinition {
  /**
   * Indicates whether the section is mandatory.
   * For single row sections, this is set to false, meaning that a value is not required.
   */
  mandatory = false

  /**
   * Specifies whether the section can have multiple rows.
   * For single row sections, this is set to false, indicating that only one row (the header row) is allowed.
   */
  multiple = false

  /**
   * Determines if multiple instances of this section type are allowed in the model.
   * For single row sections, this is set to false, enforcing that only one instance exists.
   */
  multiInstancesAllowed = false

  /**
   * Gets the data rows of this section.
   *
   * Since a single row section always uses its header row as its sole data row,
   * this getter returns an array containing only the header row ID.
   *
   * @returns An array with the header row ID.
   */
  get dataRows(): string[] {
    return [this.headerRow]
  }

  /**
   * Sets the data rows for this section.
   *
   * For a single row section, data rows cannot be modified,
   * so this setter does nothing.
   *
   * @param rowId - The new value for data rows (ignored).
   */
  set dataRows(rowId) {
    // Do nothing, as a single row section always consists solely of the header row.
  }
}
