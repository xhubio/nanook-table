import { v4 as uuidv4 } from 'uuid'

import {
  FilterInterface,
  MetaTable,
  MetaTestcase,
  PREFIX_GENERATOR,
  PREFIX_REFERENCE,
  TestcaseDefinitionInterface,
  TestcaseDirectivesInterface,
  FieldDirective,
  FieldDirectiveInterface,
  GeneratorDirective,
  GeneratorDirectiveInterface,
  ReferenceDirective,
  StaticDirective
} from '../model/index.js'
import { LoggerInterface } from '../logger/index.js'

import { TableDecisionInterface } from './interface/TableDecisionInterface.js'
import { TagSectionDefinition } from './sections/TagSectionDefinition.js'
import { SectionType } from './sections/SectionTypeEnum.js'
import { FilterSectionDefinition } from './sections/FilterSectionDefinition.js'
import { GeneratorSwitchSectionDefinition } from './sections/GeneratorSwitchSectionDefinition.js'
import { FieldSectionDefinition } from './sections/FieldSectionDefinition.js'
import { FieldSubSectionDefinition } from './sections/FieldSubSectionDefinition.js'
import { MultiRowSectionDefinition } from './sections/MultiRowSectionDefinition.js'
import {
  SectionErrorInterface,
  SectionInterface
} from './interface/SectionInterface.js'

export interface TestcaseDefinitionDecisionOptions {
  /** Some meta information for this test case */
  tableMeta: MetaTable

  /** The name of the test case */
  testcaseName: string

  /** Defines how often this test case should be created. Any number greater than 0 */
  multiplicity?: number

  /** Should this test case be executed or is it only for a reference */
  execute?: boolean

  /** A back reference to the table containing this test case */
  table: TableDecisionInterface

  /**
   * The data for this testcase.
   *  In case of a decision table, a test case is a column. All the data in this
   * column is stored by an identifier. The identifier is a value in the row.
   */
  data: Record<string, string>

  /** The logger for this model */
  logger: LoggerInterface
}

/**
 * A test case is one column in the test case part. This is the implementation for the decision table.
 */
export class TestcaseDefinitionDecision implements TestcaseDefinitionInterface {
  /** The id of this test case. This could be any unique value */
  id: string = uuidv4()

  /** Some meta information for this test case */
  tableMeta: MetaTable

  /** The name of the test case */
  testcaseName: string

  /** Defines how often this test case should be created. Any number greater than 0 */
  multiplicity: number = 1

  /** Should this test case be executed or is it only for a reference */
  execute: boolean = true

  /**  This means that a test case should not be executed if a referenced test case has this set to true */
  neverExecute: boolean = false

  /**
   * The data for this testcase.
   *  In case of a decision table, a test case is a column. All the data in this
   * column is stored by an identifier. The identifier is a value in the row.
   */
  data: Record<string, string>

  /** A back reference to the table containing this test case */
  table: TableDecisionInterface

  /** Defines if this testcase is included into the completness computation */
  isPartOfCompletion: boolean = true

  /** The logger for this model */
  logger: LoggerInterface

  constructor(opts: TestcaseDefinitionDecisionOptions) {
    const {
      tableMeta,
      testcaseName,
      table,
      execute,
      multiplicity,
      data,
      logger
    } = opts

    this.data = data
    this.table = table
    this.logger = logger
    this.tableMeta = tableMeta
    this.testcaseName = testcaseName

    if (execute !== undefined) {
      this.execute = execute
    }
    if (multiplicity !== undefined) {
      this.multiplicity = multiplicity
    }
  }

  get testcaseMeta(): MetaTestcase {
    return {
      ...this.tableMeta,
      testcaseName: this.testcaseName
    }
  }

  /**
   * Clone the current testcase definition.
   * @returns A clone of this test case definition.
   */
  clone(): TestcaseDefinitionDecision {
    const newTd = new TestcaseDefinitionDecision({
      data: this.data,
      tableMeta: this.tableMeta,
      testcaseName: this.testcaseName,
      table: this.table,
      execute: this.execute,
      multiplicity: this.multiplicity,
      logger: this.logger
    })

    newTd.isPartOfCompletion = this.isPartOfCompletion
    newTd.neverExecute = this.neverExecute

    return newTd
  }

  /**
   * Returns all the tag values found in this test case
   * @returns An Array with all the found tag values
   */
  createTags(): string[] {
    const tags: string[] = []

    for (const sectionRowId of this.table.sectionOrder) {
      const section = this.table.sections[sectionRowId]
      if (section.sectionType === SectionType.TAG_SECTION) {
        const rowIds = section.dataRows

        const tagSection = section as TagSectionDefinition

        rowIds.forEach((dataRowId) => {
          const val = this.data[dataRowId]
          if (val !== undefined) {
            const tag = tagSection.tags[dataRowId]
            tags.push(tag)
          }
        })
      }
    }
    return tags
  }

  /**
   * Returns all the filter found in this test case
   * @returns An Array with all the found filter
   */
  createFilter(): FilterInterface[] {
    const filterList: FilterInterface[] = []

    for (const sectionRowId of this.table.sectionOrder) {
      const section = this.table.sections[sectionRowId]
      if (section.sectionType === SectionType.FILTER_SECTION) {
        const rowIds = section.dataRows

        const filterSection = section as FilterSectionDefinition

        rowIds.forEach((dataRowId) => {
          const val = this.data[dataRowId]
          if (val !== undefined) {
            const filterProcessorName =
              filterSection.filterProcessorNames[dataRowId]
            const expression = filterSection.expressions[dataRowId]
            const comment = filterSection.comments[dataRowId]
            const filterElement: FilterInterface = {
              filterProcessorName,
              expression,
              comment
            }
            filterList.push(filterElement)
          }
        })
      }
    }

    return filterList
  }

  /**
   * Returns a list of generator names which should not be executed
   * @returns An Array with alle the generator names to be switched off for this test case
   */
  createGeneratorSwitches(): string[] {
    const generatorNames: string[] = []

    for (const sectionRowId of this.table.sectionOrder) {
      const section = this.table.sections[sectionRowId]
      if (section.sectionType === SectionType.GENERATOR_SWITCH_SECTION) {
        const rowIds = section.dataRows

        const generatorSwitchSection =
          section as GeneratorSwitchSectionDefinition

        for (const dataRowId of rowIds) {
          const val = this.data[dataRowId]
          const valueElement = generatorSwitchSection.values[dataRowId]
          if (val !== undefined && val !== '' && this.isTrue(valueElement)) {
            const genName = generatorSwitchSection.generatorNames[dataRowId]
            generatorNames.push(genName)
          }
        }
      }
    }
    return generatorNames
  }

  /**
   * Checks if the given string contains a valid true value
   * @param val - The expression to check
   * @returns TRUE if the value is a valid boolean true value.
   */
  private isTrue(val: string) {
    if (typeof val === 'string') {
      const expression = val.toUpperCase()
      if (
        expression === 'T' ||
        expression === 'TRUE' ||
        expression === 'YES' ||
        expression === 'Y' ||
        expression === 'JA' ||
        expression === 'J' ||
        expression === '1'
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Create all the directives for this testcase definition
   * @returns An object with all the directives by there type
   */
  createDirectives(): TestcaseDirectivesInterface {
    const directives: TestcaseDirectivesInterface = {
      generator: [],
      static: [],
      reference: [],
      field: []
    }

    // -------------------------------------------
    // Fills the node with:
    // - generator commands
    // - static values
    // - references
    // - meta data
    // -------------------------------------------
    for (const sectionRowId of this.table.sectionOrder) {
      const section = this.table.sections[sectionRowId]
      // For this section we need to call the generator or the reference
      if (section.sectionType === SectionType.FIELD_SECTION) {
        const fieldSection = section as FieldSectionDefinition

        // we need to iterate the subSections
        for (const subSectionId of fieldSection.dataRows) {
          const subSection = fieldSection.subSections[subSectionId]
          const { generatorCmd } =
            this.getGeneratorCommandForSubSection(subSection)

          if (
            generatorCmd !== undefined &&
            generatorCmd.toLowerCase().startsWith(PREFIX_GENERATOR)
          ) {
            const directive = this.createGeneratorDirective(subSection, generatorCmd)
            directives.generator.push(directive)
          } else if (
            generatorCmd !== undefined &&
            generatorCmd.toLowerCase().startsWith(PREFIX_REFERENCE)
          ) {
            const directive = this.createReferenceDirective(subSection, generatorCmd)
            directives.reference.push(directive)
          } else if (generatorCmd !== undefined) {
            const directive = this.createStaticValueDirective(subSection, generatorCmd)
            directives.static.push(directive)
          } else {
            this.logger.info(
              `No Generator data for table '${this.testcaseMeta.tableName}' and field '${subSection.name}' for test case '${this.testcaseMeta.testcaseName}'`
            )
          }
        }
      } else if (section.sectionType === SectionType.MULTI_ROW_SECTION) {
        // This section only adds meta data to the testcase
        const directiveList = this.createMultirowSectionDirective(
          section as MultiRowSectionDefinition
        )
        for (const directive of directiveList) {
          directives.field.push(directive)
        }
      }
    }

    return directives
  }

  /**
   * Gets the generator command for a FieldSubSection
   * @param subSection - The FieldSubSection
   * @returns The generator command from the sub section
   */
  private getGeneratorCommandForSubSection(
    subSection: FieldSubSectionDefinition
  ): {
    /** The generator cmd value */
    generatorCmd: string

    /** The key of the value in the subSection */
    key: string
  } {
    const rowIds = subSection.dataRows

    // a subsection could have more than one entry.
    // later on we need to randomly extract one of them
    const dataSetE: Record<string, string> = {}
    const dataSetA: Record<string, string> = {} // if the value is an 'a' this means prefered value
    for (const dataRowId of rowIds) {
      const val = this.data[dataRowId]
      if (val !== undefined && val !== '' && val.toLowerCase() !== 'i') {
        if (val.toLowerCase() === 'a' || val.toLowerCase() === 'x') {
          dataSetA[dataRowId] = val
        } else {
          dataSetE[dataRowId] = val
        }
      }
    }

    // get a list of the possible candidates
    const dataSetKeysA = Object.keys(dataSetA)
    const dataSetKeysE = Object.keys(dataSetE)

    let dataSetKeys
    if (dataSetKeysA.length > 0) {
      dataSetKeys = dataSetKeysA
    } else {
      dataSetKeys = dataSetKeysE
    }

    const idx = Math.floor(Math.random() * dataSetKeys.length)
    const key = dataSetKeys[idx]
    const generatorCmd = subSection.tdgs[key]

    return { generatorCmd, key }
  }

  /**
   * Creates the generator directive
   * @param subSection - The current FieldSubSection
   * @param generatorCmd - The generator command
   * @returns  A generator Directive
   */
  private createGeneratorDirective(
    subSection: FieldSubSectionDefinition,
    generatorCmd: string
  ): GeneratorDirectiveInterface {
    const parts = generatorCmd.split(':')
    parts.shift()
    const instanceIdSuffix = parts.shift()
    const generatorName = parts.shift()
    const config = parts.join(':')
    const fieldName = subSection.name

    if (
      fieldName === undefined ||
      generatorName === undefined ||
      instanceIdSuffix === undefined
    ) {
      throw new Error('Missing value: should not be possible')
    }

    const directive = new GeneratorDirective({
      fieldName,
      testcaseMeta: {
        fileName: this.testcaseMeta.fileName,
        tableName: this.testcaseMeta.tableName,
        tableType: this.testcaseMeta.tableType,
        testcaseName: this.testcaseMeta.testcaseName
      },
      instanceIdSuffix,
      generatorName,
      config
    })

    return directive
  }

  /**
   * Creates a reference directive
   * @param subSection - The current FieldSubSection
   * @param generatorCmd - The reference command
   */
  private createReferenceDirective(
    subSection: FieldSubSectionDefinition,
    generatorCmd: string
  ): ReferenceDirective {
    const parts = generatorCmd.split(':')
    const instanceIdSuffix = parts[1]
    // self references may have no table name
    const targetTableName = parts[2] || this.testcaseMeta.tableName
    const targetFieldName = parts[3]
    const targetTestcaseName = parts[4]
    const fieldName = subSection.name

    if (
      fieldName === undefined ||
      targetTableName === undefined ||
      targetTestcaseName === undefined ||
      targetFieldName === undefined
    ) {
      throw new Error('Missing value: should not be possible')
    }

    const directive = new ReferenceDirective({
      fieldName,
      testcaseMeta: {
        fileName: this.testcaseMeta.fileName,
        tableName: this.testcaseMeta.tableName,
        tableType: this.testcaseMeta.tableType,
        testcaseName: this.testcaseMeta.testcaseName
      },
      instanceIdSuffix,
      targetFieldName,
      targetTableName,
      targetTestcaseName
    })
    return directive
  }

  /**
   * Creates the directive for static values
   * @param subSection - The current FieldSubSection
   * @param generatorCmd - The generator command
   * @returns A static Directive
   */
  private createStaticValueDirective(
    subSection: FieldSubSectionDefinition,
    generatorCmd: string
  ): StaticDirective {
    const fieldName = subSection.name

    if (fieldName === undefined) {
      throw new Error('Missing value: should not be possible')
    }

    const directive = new StaticDirective({
      fieldName,
      testcaseMeta: {
        fileName: this.testcaseMeta.fileName,
        tableName: this.testcaseMeta.tableName,
        tableType: this.testcaseMeta.tableType,
        testcaseName: this.testcaseMeta.testcaseName
      },
      value: generatorCmd
    })

    return directive
  }

  /**
   * Create a meta directive
   * @param section - The current multiRowSection
   * @returns An array of meta Directives
   */
  private createMultirowSectionDirective(
    section: MultiRowSectionDefinition
  ): FieldDirective[] {
    const rowIds = section.dataRows
    const fieldName = section.name
    const directiveList: FieldDirectiveInterface[] = []

    if (fieldName === undefined) {
      throw new Error('Missing value: should not be possible')
    }

    for (const dataRowId of rowIds) {
      const val = this.data[dataRowId]
      if (val !== undefined && val !== '') {
        const directive = new FieldDirective({
          fieldName,
          testcaseMeta: {
            fileName: this.testcaseMeta.fileName,
            tableName: this.testcaseMeta.tableName,
            tableType: this.testcaseMeta.tableType,
            testcaseName: this.testcaseMeta.testcaseName
          },
          key: section.keys[dataRowId],
          comment: section.comments[dataRowId],
          other: section.others[dataRowId]
        })

        directiveList.push(directive)
      }
    }

    return directiveList
  }

  /**
   * Claculates how many entries per section are defined
   * @param sectionRowId - The id of the section containing these rows
   * @param rowIds - All the arrays of this section
   * @returns  The number of entries
   */
  calculate(sectionRowId: string, rowIds: string[]): number {
    let count = 0
    rowIds.forEach((rowId) => {
      if (this.data[rowId] !== undefined) {
        count++
      }
    })

    this.data[sectionRowId] = `${count}`
    return count
  }

  /**
   * Set a value for a row in this testcase
   * @param rowId - The rowId for this value
   * @param value - The value to be set
   */
  setValue(rowId: string, value: string | undefined): void {
    if (value === undefined) {
      // delete the value
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.data[rowId]
    } else {
      // set a value
      this.data[rowId] = value
    }
  }

  /**
   * Set a value for a row in this testcase
   * @param rowId - The rowId for this value
   * @returns The value of this row id
   */
  getValue(rowId: string): string {
    return this.data[rowId]
  }

  /**
   * Validates this section definition.
   * - A testcase must have a name
   * - A fieldSection must have at least one subSection
   * - If mandatory = true for a section, it must have at least one entry
   * - if multiple = false it must have only one entry per section
   * @param section - The section to be validated
   * @returns An array of issues found
   */
  validate(section: SectionInterface): SectionErrorInterface[] {
    const issues: SectionErrorInterface[] = []

    if (this.testcaseMeta.testcaseName === undefined) {
      issues.push({
        testCase: this,
        type: 'testcase',
        message: 'The testcase has no name',
        level: 'ERROR'
      })
    }

    // count how many rows of this section have a value
    let counter = 0
    section.dataRows.forEach((rowId) => {
      if (this.data[rowId] !== undefined) {
        counter++
      }
    })

    if (section.mandatory && counter === 0) {
      // error values missing
      issues.push({
        section,
        type: 'testcase value',
        message: `The testcase '${this.testcaseMeta.testcaseName}' has no value defined for the section '${section.name}'`,
        level: 'ERROR',
        rowId: section.headerRow,
        column: this.id
      })
    }

    if (!section.multiple && counter > 1) {
      // error too many values
      issues.push({
        section,
        type: 'testcase value',
        message: `The testcase '${this.testcaseMeta.testcaseName}' has too many values defined for the section '${section.name}'`,
        level: 'ERROR',
        rowId: section.headerRow,
        column: this.id
      })
    }

    return issues
  }
}
