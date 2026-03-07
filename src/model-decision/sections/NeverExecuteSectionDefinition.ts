import { BaseSingleRowSectionDefinition } from './BaseSingleRowSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Represents a section that indicates a test case should not be executed.
 *
 * This section is used to mark test cases as non-executable, typically because they are only
 * referenced by another test case. Being a single row section, it uses its header row as its sole data row.
 */
export class NeverExecuteSectionDefinition extends BaseSingleRowSectionDefinition {
  /**
   * The section type is set to NEVER_EXECUTE_SECTION.
   */
  sectionType = SectionType.NEVER_EXECUTE_SECTION
}
