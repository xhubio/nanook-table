import { BaseSingleRowSectionDefinition } from './BaseSingleRowSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents the execute section in a decision table.
 *
 * This section determines whether a test case should be actively created for execution,
 * or if the test case definition is only used as a reference source.
 * As a single row section, it contains only the header row.
 */
export class ExecuteSectionDefinition extends BaseSingleRowSectionDefinition {
  /**
   * The section type, set to EXECUTE_SECTION.
   */
  sectionType = SectionType.EXECUTE_SECTION
}
