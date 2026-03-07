import { MetaTable } from '../model/index.js'
import { TestcaseDefinitionDecision } from './TestcaseDefinitionDecision.js'
import {
  SectionErrorInterface,
  SectionInterface
} from './interface/SectionInterface.js'
import { TABLE_TYPE_DECISION_TABLE } from './constants.js'
import { SectionType } from './sections/SectionTypeEnum.js'
import { FieldSectionDefinition } from './sections/FieldSectionDefinition.js'
import { SummarySectionDefinition } from './sections/SummarySectionDefinition.js'
import { MultiplicitySectionDefinition } from './sections/MultiplicitySectionDefinition.js'
import { NeverExecuteSectionDefinition } from './sections/NeverExecuteSectionDefinition.js'
import { ExecuteSectionDefinition } from './sections/ExecuteSectionDefinition.js'
import { GeneratorSwitchSectionDefinition } from './sections/GeneratorSwitchSectionDefinition.js'
import { FilterSectionDefinition } from './sections/FilterSectionDefinition.js'
import { TagSectionDefinition } from './sections/TagSectionDefinition.js'
import { MultiRowSectionDefinition } from './sections/MultiRowSectionDefinition.js'
import { TableDecisionInterface } from './interface/TableDecisionInterface.js'
import { LoggerInterface } from '../logger/index.js'

export interface TableDecisionOptions {
  /** The file name of the table */
  fileName: string
  /** The human-readable name of the table */
  tableName: string
  /** Logger instance for this model */
  logger: LoggerInterface
}

/**
 * Implementation of a decision table model.
 *
 * This class manages test cases and their associated sections for a decision table.
 * It maintains the order of test cases, stores their definitions, and holds the definitions of various sections,
 * such as field, summary, multiplicity, etc. It provides methods to retrieve test cases by name, iterate over
 * test cases for execution, calculate summary information, validate the model, and add new sections or test cases.
 */
export class TableDecision implements TableDecisionInterface {
  /** The table type, set to the constant TABLE_TYPE_DECISION_TABLE */
  readonly tableType: string = TABLE_TYPE_DECISION_TABLE

  /** Logger instance used for logging operations */
  logger: LoggerInterface

  /** The file name from which the table is loaded */
  fileName: string

  /** The human-readable name of the table */
  tableName: string

  /** Array of test case IDs defining the order in which test cases are processed */
  testcaseOrder: string[] = []

  /** Mapping of test case IDs to their TestcaseDefinitionDecision objects */
  testcases: Record<string, TestcaseDefinitionDecision> = {}

  /** Mapping of section IDs to section definitions */
  sections: Record<string, SectionInterface> = {}

  /** Array of section IDs representing the order of sections in the table */
  sectionOrder: string[] = []

  /**
   * Map to enforce that sections which should exist only once are not duplicated.
   * The key is the section type and the value is the corresponding section definition.
   */
  singleCheck: Map<SectionType, SectionInterface> = new Map<
    SectionType,
    SectionInterface
  >()

  /**
   * Set to store unique keys for sections (combination of section type and section name)
   * to ensure that section names are unique within the same type.
   */
  sectionNames: Set<string> = new Set<string>()

  /**
   * Constructs a new instance of TableDecision.
   * @param opts - Options for initializing the table, including fileName, tableName, and logger.
   */
  constructor(opts: TableDecisionOptions) {
    this.logger = opts.logger
    this.fileName = opts.fileName
    this.tableName = opts.tableName
  }

  /**
   * Returns the meta-information of the table.
   * @returns An object containing fileName, tableName, and tableType.
   */
  get tableMeta(): MetaTable {
    return {
      fileName: this.fileName,
      tableName: this.tableName,
      tableType: this.tableType
    }
  }

  /**
   * Retrieves the test case definition for the specified test case name.
   * Iterates over the test cases in order and returns the one matching the given name.
   * @param testcaseName - The name of the test case to retrieve.
   * @returns The matching TestcaseDefinitionDecision.
   * @throws Error if no matching test case is found.
   */
  getTestcaseForName(testcaseName: string): TestcaseDefinitionDecision {
    for (const tcId of this.testcaseOrder) {
      const tc = this.testcases[tcId]
      if (tc.testcaseMeta.testcaseName === String(testcaseName)) {
        return tc
      }
    }
    throw new Error(
      `Could not find the testcase '${testcaseName}' in the table '${this.tableMeta.tableName}'`
    )
  }

  /**
   * Generator function that yields all test cases intended for execution.
   * For each test case marked for execution, the method clones the test case definition.
   * If a test case has a multiplicity greater than one, its name is updated to include the instance number.
   * @returns A generator yielding cloned TestcaseDefinitionDecision objects.
   */
  *getTestcasesForExecution(): Generator<
    TestcaseDefinitionDecision,
    void,
    void
  > {
    for (const testcaseId of this.testcaseOrder) {
      const testcaseDefinition = this.testcases[testcaseId]
      if (testcaseDefinition.execute) {
        for (let i = 0; i < testcaseDefinition.multiplicity; i++) {
          const td = testcaseDefinition.clone()
          if (testcaseDefinition.multiplicity > 1) {
            td.testcaseName = `${testcaseDefinition.testcaseMeta.testcaseName}.${i + 1}`
          }
          yield td
        }
      }
    }
    return
  }

  /**
   * Parses a test case name that may represent a range.
   * If the input is a range (e.g., "[tc12-14]"), it expands it to an array of individual test case names.
   * Otherwise, it returns an array containing the original test case name.
   * @param testcaseName - The test case name or range string.
   * @returns An array of test case names.
   */
  processRanges(testcaseName: string): string[] {
    if (testcaseName.match(/^\[.+\]$/)) {
      const tcNames = []
      const cleanRange = testcaseName.replace(/^\[(.+)\]$/, '$1')
      const elements = cleanRange.split(',')

      // Regular expression to capture a non-digit prefix and a numeric range.
      const regEx = /(\D*)(\d+)-(\d+)$/
      for (const element of elements) {
        const matches = element.trim().match(regEx)
        if (matches !== null) {
          const startElement = matches[1]
          let startNumber = parseInt(matches[2], 10)
          let endNumber = parseInt(matches[3], 10)

          // Ensure the range is in ascending order.
          if (startNumber > endNumber) {
            const tmp = endNumber
            endNumber = startNumber
            startNumber = tmp
          }

          for (let i = startNumber; i <= endNumber; i++) {
            tcNames.push(`${startElement}${i}`)
          }
        } else {
          tcNames.push(element)
        }
      }
      return tcNames
    }
    return [testcaseName]
  }

  /**
   * Calculates summary values for each section and updates the test case data.
   * Iterates over each test case and section, calculating multiplicative summaries based on
   * counts from field sub-sections, and updates the summary section with totals and percentages.
   * @throws Error if the summary section is missing.
   */
  calculate(): void {
    let isFirst = true
    let sumAll = 1
    let summarySection: SummarySectionDefinition | undefined
    this.testcaseOrder.forEach((tcId) => {
      let summarySectionId: string | undefined
      let sum = 1

      const testcase = this.testcases[tcId]

      this.sectionOrder.forEach((sectionRowId) => {
        const section = this.sections[sectionRowId]

        if (section.sectionType === SectionType.FIELD_SECTION) {
          const fieldSection = section as FieldSectionDefinition
          const sectionId = section.headerRow
          let sectionSum = 1
          // Iterate through each sub-section to calculate counts.
          section.dataRows.forEach((subSectionId) => {
            const subSection = fieldSection.subSections[subSectionId]
            const rowIds = subSection.dataRows
            const count = testcase.calculate(sectionId, rowIds)
            sectionSum *= count
            sum *= count
            if (isFirst) {
              sumAll *= rowIds.length
            }
            // Save the count as a string in the test case data.
            testcase.data[subSectionId] = `${count}`
          })
          // Save the section sum in the test case data.
          testcase.data[sectionId] = `${sectionSum}`
        } else if (section.sectionType === SectionType.SUMMARY_SECTION) {
          summarySectionId = section.headerRow
          if (isFirst) {
            summarySection = section as SummarySectionDefinition
          }
        }
      })

      if (summarySectionId === undefined) {
        throw new Error(
          `There is no 'summarySection' in Table ${this.tableMeta.tableName}`
        )
      }

      testcase.data[summarySectionId] = `${sum}`
      isFirst = false
    })

    if (summarySection === undefined) {
      throw new Error(
        `There is no 'summarySection' in Table ${this.tableMeta.tableName}`
      )
    }

    // Update overall summary: total count and percentage completion.
    const summarySectionId = summarySection.headerRow
    let allTestcaseSum = 0
    this.testcaseOrder.forEach((tcId) => {
      const testcase = this.testcases[tcId]
      allTestcaseSum += parseInt(testcase.data[summarySectionId])
    })
    summarySection.total = sumAll
    summarySection.done = allTestcaseSum
    summarySection.percent = (allTestcaseSum / sumAll) * 100
  }

  /**
   * Validates the decision table model by checking for configuration and data issues.
   * Validation rules include:
   * - The table must have a name.
   * - There must be at least one field section.
   * - Field names must be unique within the table.
   * - The table must contain at least one test case.
   * @returns An array of validation issues, each conforming to SectionErrorInterface.
   */
  validate() {
    const issues: SectionErrorInterface[] = []

    if (this.tableMeta.tableName === undefined) {
      issues.push({
        type: 'tableDecision',
        message: 'The table has no name',
        level: 'ERROR'
      })
    }

    const fieldNames = new Set()

    // Validate each section in the table.
    this.sectionOrder.forEach((sectionRowId) => {
      const section = this.sections[sectionRowId]

      if (section.sectionType === SectionType.FIELD_SECTION) {
        // Validate each sub-section within the field section.
        section.dataRows.forEach((subSectionId) => {
          const fieldSection = section as FieldSectionDefinition
          const subSection = fieldSection.subSections[subSectionId]
          const fieldName = subSection.name
          if (fieldNames.has(fieldName)) {
            issues.push({
              tableName: this.tableMeta.tableName,
              type: 'tableDecision',
              message: `The fieldName '${fieldName}' is duplicated in the table '${this.tableMeta.tableName}'`,
              level: 'ERROR'
            })
          } else {
            fieldNames.add(fieldName)
          }
          this.validateSection(subSection, issues)
          this.validateTestcase(subSection, issues)
        })
      }
      // Validate the section itself and its related test cases.
      this.validateSection(section, issues)
      this.validateTestcase(section, issues)
    })

    return issues
  }

  /**
   * Validates a given section by invoking its own validate method.
   * Appends any validation issues found to the provided issues array.
   * @param section - The section to validate.
   * @param issues - The array to store any validation issues.
   */
  private validateSection(
    section: SectionInterface,
    issues: SectionErrorInterface[]
  ) {
    section.validate().forEach((issue) => {
      issues.push(issue)
    })
  }

  /**
   * Validates each test case against a given section.
   * Iterates over all test cases and collects validation issues from each test case's validate method.
   * @param section - The section against which to validate the test cases.
   * @param issues - The array to store any validation issues.
   */
  private validateTestcase(
    section: SectionInterface,
    issues: SectionErrorInterface[]
  ) {
    this.testcaseOrder.forEach((tcId) => {
      const testcase = this.testcases[tcId]
      testcase.validate(section).forEach((issue) => {
        issues.push(issue)
      })
    })
  }

  /**
   * Adds a new section to the table model.
   * Ensures that the section name is unique for its type and that sections which should only appear once are not duplicated.
   * Validates the insertion position and updates the sections record and sectionOrder array.
   * @param sectionDefinition - The section definition to be added.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The added section definition.
   * @throws Error if the section name is duplicated or if a single-instance section is added more than once.
   */
  private addNewSection(
    sectionDefinition: SectionInterface,
    position?: number
  ) {
    const key = `${sectionDefinition.sectionType}_${sectionDefinition.name}`
    if (this.sectionNames.has(key)) {
      throw new Error(
        `The name '${sectionDefinition.name}' for the section of type '${sectionDefinition.sectionType}' is duplicated in the table '${this.tableMeta.tableName}'`
      )
    } else {
      this.sectionNames.add(key)
    }

    if (!sectionDefinition.multiInstancesAllowed) {
      if (this.singleCheck.has(sectionDefinition.sectionType)) {
        throw new Error(
          `The section of type '${sectionDefinition.sectionType}' must not be added multiple times to the model`
        )
      }
      this.singleCheck.set(sectionDefinition.sectionType, sectionDefinition)
    }

    this.checkParameterAddSection(position)

    const id = sectionDefinition.headerRow
    if (id === undefined) {
      throw new Error(
        `The section '${sectionDefinition.name}' to be added in table '${this.tableMeta.tableName}' has no 'headerRow'`
      )
    }

    this.sections[id] = sectionDefinition

    if (position === undefined || position >= this.sectionOrder.length) {
      this.sectionOrder.push(id)
    } else {
      this.sectionOrder.splice(position, 0, id)
    }

    return sectionDefinition
  }

  /**
   * Adds a new test case to the table.
   * Creates a new TestcaseDefinitionDecision instance with the current table meta-information,
   * inserts it into the testcases record, and updates the testcaseOrder array.
   * @param name - The name for the new test case.
   * @param position - (Optional) The position at which to insert the new test case.
   * @returns The newly created TestcaseDefinitionDecision instance.
   */
  addNewTestcase(name: string, position?: number): TestcaseDefinitionDecision {
    const testcase = new TestcaseDefinitionDecision({
      data: {},
      logger: this.logger,
      tableMeta: {
        fileName: this.tableMeta.fileName,
        tableName: this.tableMeta.tableName,
        tableType: this.tableMeta.tableType
      },
      testcaseName: name,
      table: this
    })

    const id = testcase.id
    this.testcases[id] = testcase

    if (position === undefined || position >= this.testcaseOrder.length) {
      this.testcaseOrder.push(id)
    } else {
      this.testcaseOrder.splice(position, 0, id)
    }

    return testcase
  }

  /**
   * Adds a new FieldSection to the table.
   * Instantiates a new FieldSectionDefinition and adds it via the addNewSection helper.
   * @param name - The unique name for the new field section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created FieldSectionDefinition.
   */
  addNewFieldSection(name: string, position?: number): FieldSectionDefinition {
    return this.addNewSection(
      new FieldSectionDefinition({ name }),
      position
    ) as FieldSectionDefinition
  }

  /**
   * Adds a new MultiRowSection to the table.
   * Instantiates a new MultiRowSectionDefinition and adds it via the addNewSection helper.
   * @param name - The unique name for the new multi-row section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created MultiRowSectionDefinition.
   */
  addNewMultiRowSection(
    name: string,
    position?: number
  ): MultiRowSectionDefinition {
    return this.addNewSection(
      new MultiRowSectionDefinition({ name }),
      position
    ) as MultiRowSectionDefinition
  }

  /**
   * Adds a new TagSection to the table.
   * Instantiates a new TagSectionDefinition and adds it via the addNewSection helper.
   * @param name - The unique name for the new tag section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created TagSectionDefinition.
   */
  addNewTagSection(name: string, position?: number): TagSectionDefinition {
    return this.addNewSection(
      new TagSectionDefinition({ name }),
      position
    ) as TagSectionDefinition
  }

  /**
   * Adds a new FilterSection to the table.
   * Instantiates a new FilterSectionDefinition and adds it via the addNewSection helper.
   * @param name - The unique name for the new filter section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created FilterSectionDefinition.
   */
  addNewFilterSection(
    name: string,
    position?: number
  ): FilterSectionDefinition {
    return this.addNewSection(
      new FilterSectionDefinition({ name }),
      position
    ) as FilterSectionDefinition
  }

  /**
   * Adds a new GeneratorSwitchSection to the table.
   * Instantiates a new GeneratorSwitchSectionDefinition and adds it via the addNewSection helper.
   * @param name - The unique name for the new generator switch section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created GeneratorSwitchSectionDefinition.
   */
  addNewGeneratorSwitchSection(
    name: string,
    position?: number
  ): GeneratorSwitchSectionDefinition {
    return this.addNewSection(
      new GeneratorSwitchSectionDefinition({ name }),
      position
    ) as GeneratorSwitchSectionDefinition
  }

  /**
   * Adds a new SummarySection to the table.
   * Instantiates a new SummarySectionDefinition and adds it via the addNewSection helper.
   * Note: Test cases are not updated when adding a summary section.
   * @param name - The unique name for the new summary section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created SummarySectionDefinition.
   */
  addNewSummarySection(
    name: string,
    position?: number
  ): SummarySectionDefinition {
    return this.addNewSection(
      new SummarySectionDefinition({ name }),
      position
    ) as SummarySectionDefinition
  }

  /**
   * Adds a new ExecuteSection to the table.
   * Instantiates a new ExecuteSectionDefinition and adds it via the addNewSection helper.
   * Note: Test cases are not updated when adding an execute section.
   * @param name - The unique name for the new execute section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created ExecuteSectionDefinition.
   */
  addNewExecuteSection(
    name: string,
    position?: number
  ): ExecuteSectionDefinition {
    return this.addNewSection(
      new ExecuteSectionDefinition({ name }),
      position
    ) as ExecuteSectionDefinition
  }

  /**
   * Adds a new NeverExecuteSection to the table.
   * Instantiates a new NeverExecuteSectionDefinition and adds it via the addNewSection helper.
   * Note: Test cases are not updated when adding a never-execute section.
   * @param name - The unique name for the new never-execute section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created NeverExecuteSectionDefinition.
   */
  addNewNeverExecuteSection(
    name: string,
    position?: number
  ): NeverExecuteSectionDefinition {
    return this.addNewSection(
      new NeverExecuteSectionDefinition({ name }),
      position
    ) as NeverExecuteSectionDefinition
  }

  /**
   * Adds a new MultiplicitySection to the table.
   * Instantiates a new MultiplicitySectionDefinition and adds it via the addNewSection helper.
   * Note: Test cases are not updated when adding a multiplicity section.
   * @param name - The unique name for the new multiplicity section.
   * @param position - (Optional) The position at which to insert the new section.
   * @returns The newly created MultiplicitySectionDefinition.
   */
  addNewMultiplicitySection(
    name: string,
    position?: number
  ): MultiplicitySectionDefinition {
    return this.addNewSection(
      new MultiplicitySectionDefinition({ name }),
      position
    ) as MultiplicitySectionDefinition
  }

  // TODO: Delete Section. When deleting a single row section it must also be removed from 'this.singleCheck'

  /**
   * Validates the position parameter for adding a new section.
   * Throws an error if the position is defined and is less than 0.
   * @param position - (Optional) The position at which the section is to be added.
   */
  private checkParameterAddSection(position?: number) {
    if (position !== undefined && position < 0) {
      throw new Error(`The parameter position '${position}' must be >= 0`)
    }
  }
}
