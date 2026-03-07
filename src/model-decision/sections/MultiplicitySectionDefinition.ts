import { BaseSingleRowSectionDefinition } from './BaseSingleRowSectionDefinition.js'
import { SectionType } from './SectionTypeEnum.js'

/**
 * Defines the multiplicity of test cases in the decision table.
 *
 * This section specifies how many instances of a test case should be created from a single
 * test case definition in the table. For example:
 * - A value of '1' (default) indicates that the test case is created once.
 * - A value of '0' indicates that no test case will be created.
 * - A value of '5' indicates that five instances of the test case definition should be generated.
 *
 * This class extends BaseSingleRowSectionDefinition, meaning that it utilizes a single row (the header row)
 * as its data row, and its section type is set to MULTIPLICITY_SECTION.
 */
export class MultiplicitySectionDefinition extends BaseSingleRowSectionDefinition {
  sectionType = SectionType.MULTIPLICITY_SECTION
}
