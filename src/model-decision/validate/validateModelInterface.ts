/**
 * Represents the row model for a single section.
 * It contains the list of row IDs associated with a section and the ID of its parent section.
 */
export interface ValidateRowModelRow {
  /**
   * The list of row IDs for one section.
   */
  rows: string[]

  /**
   * The ID of the parent section.
   */
  parentSectionId: string
}

/**
 * Represents the overall row model.
 * It maps each section ID to its corresponding row model.
 */
export type ValidateRowModel = Record<string, ValidateRowModelRow>

/**
 * Represents the validation model for a single test case.
 * This model contains the test case's unique identifier, the data mapped by section,
 * a name used for combining test cases, a flag indicating whether the test case has been merged,
 * and an optional list of merged test case IDs.
 */
export interface ValidateTestcaseModel {
  /**
   * The unique identifier of the test case.
   */
  id: string

  /**
   * The data for the test case.
   * It maps section IDs to their respective data entries.
   */
  data: ValidateTestcaseModelData

  /**
   * A name used for validation and combining test cases.
   */
  name: string

  /**
   * Flag indicating whether this test case has already been combined.
   * Set to true if the test case is merged with another.
   */
  skip: boolean

  /**
   * Optional list of test case IDs that were merged into this test case.
   */
  merge?: string[]
}

/**
 * Represents the data for a test case.
 * It maps each section ID to a data entry containing row details and computed values.
 */
export type ValidateTestcaseModelData = Record<
  string,
  ValidateTestcaseModelDataEntry
>

/**
 * Represents the data entry for a particular section within a test case.
 * It includes the row IDs for that section, the parent section ID,
 * and the computed binary values (both as numbers and strings).
 */
export interface ValidateTestcaseModelDataEntry {
  /**
   * The list of row IDs for the section.
   */
  rows: string[]

  /**
   * The ID of the parent section.
   */
  parentSectionId: string

  /**
   * The computed value(s) for the section.
   * If the section has more than 31 rows, the value is split into an array of numbers.
   * The value is derived from a binary string (e.g., "011010").
   */
  val?: number | number[]

  /**
   * The binary string representation of the computed value(s).
   */
  valStr?: string | string[]
}
