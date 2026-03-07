import { TableInterface } from '../../model/index.js'
import { SectionInterface } from './SectionInterface.js'
import { TestcaseDefinitionDecision } from '../TestcaseDefinitionDecision.js'
import { SectionType } from '../sections/SectionTypeEnum.js'

/**
 * Defines the interface for a decision table.
 *
 * A decision table is composed of test cases and various sections that
 * define its structure and behavior. This interface extends the basic
 * TableInterface with properties and methods specific to decision tables.
 */
export interface TableDecisionInterface extends TableInterface {
  /**
   * An array of test case IDs representing the order in which test cases are processed.
   */
  testcaseOrder: string[]

  /**
   * A mapping of test case IDs to their corresponding TestcaseDefinitionDecision objects.
   */
  testcases: Record<string, TestcaseDefinitionDecision>

  /**
   * A mapping of section IDs to their corresponding section definitions.
   */
  sections: Record<string, SectionInterface>

  /**
   * An array of section IDs representing the order of sections in the table.
   */
  sectionOrder: string[]

  /**
   * A map used to ensure that sections which should exist only once are not duplicated.
   * The key is the SectionType and the value is the corresponding section definition.
   */
  singleCheck: Map<SectionType, SectionInterface>

  /**
   * A set that stores a unique key for each section, combining the section type and section name.
   * This ensures that each section name is unique for its type within the table.
   */
  sectionNames: Set<string>

  /**
   * Calculates the summary for each section.
   * This method processes the data rows of each section, updates the section values,
   * and populates the summary section with overall totals.
   */
  calculate: () => void

  /**
   * Validates the decision table model.
   *
   * Validation rules include:
   * - The table must have exactly one summary section.
   * - The table must have at least one field section.
   * - The names of the fields must be unique within the table.
   * - The table must have at least one test case.
   *
   * All validation issues found are returned.
   */
  validate: () => void
}
