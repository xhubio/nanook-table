/**
 * Enum representing the different section types used in decision tables.
 *
 * Each value corresponds to a specific role or functionality in a decision table,
 * such as defining fields, filtering data, summarizing results, or controlling test case creation.
 */
export enum SectionType {
  /**
   * Base section type.
   */
  BASE_SECTION = 'BaseSection',

  /**
   * Field section: Contains the main data fields of the test cases.
   */
  FIELD_SECTION = 'FieldSection',

  /**
   * Field sub-section: A subdivision of a field section.
   */
  FIELD_SUB_SECTION = 'FieldSubSection',

  /**
   * Multi-row section: Used for sections that contain multiple rows of additional attributes or metadata.
   */
  MULTI_ROW_SECTION = 'MultiRowSection',

  /**
   * Tag section: Used to store tag values for test cases.
   */
  TAG_SECTION = 'TagSection',

  /**
   * Filter section: Contains filter criteria for selecting test cases.
   */
  FILTER_SECTION = 'FilterSection',

  /**
   * Generator switch section: Controls the execution of generators via switches.
   */
  GENERATOR_SWITCH_SECTION = 'GeneratorSwitchSection',

  /**
   * Summary section: Displays summary information about the test cases.
   */
  SUMMARY_SECTION = 'SummarySection',

  /**
   * Multiplicity section: Determines the number of test case instances to create.
   */
  MULTIPLICITY_SECTION = 'MultiplicitySection',

  /**
   * Execute section: Indicates that a test case should be created for execution.
   */
  EXECUTE_SECTION = 'ExecuteSection',

  /**
   * Never execute section: Indicates that a test case should not be executed.
   */
  NEVER_EXECUTE_SECTION = 'NeverExecuteSection',

  /**
   * Data row: Represents an individual row of data.
   */
  DATA_ROW = 'DataRow'
}
