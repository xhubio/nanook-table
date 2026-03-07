import {
  MultiRowSectionDefinition,
  TableDecision,
  SectionType
} from '../../model-decision/index.js'

import { ParserBase } from './ParserBase.js'
import {
  START_COLUMN_TESTCASE,
  DECISION_START_ROW,
  COLUMN_TYPE,
  COLUMN_FIELD_EQ_CLASS,
  COLUMN_FIELD_TDG,
  COLUMN_FIELD_COMMENT,
  COLUMN_MURO_KEY,
  COLUMN_MURO_OTHER,
  COLUMN_MURO_COMMENT
} from '../constants/ParserDecisionConstants.js'
import { START_ROW, START_COLUMN } from '../constants/ParserBaseConstants.js'
import type { TableInterface } from '../../model/index.js'
import type { ImporterInterface } from '../../importer-xlsx/index.js'
import type { ParserParseRequest } from './ParserInterface.js'

interface SectionHandlerOptions {
  table: TableDecision
  sheetName: string
  importer: ImporterInterface
  sectionName: string
  startRow: number
  endRow: number
  testCaseEndColumn: number
}
type SectionHandler = (opts: SectionHandlerOptions) => void

interface NextSectionResult {
  startRow: number
  endRow: number
  sectionType: string
}
interface NextSubSectionResult {
  startRow: number
  endRow: number
  fieldName: string
}

/**
 * The parser implementation to parse decision tables.
 */
export class ParserDecision extends ParserBase {
  /** This sequence is used to give each field a unique name. */
  fieldNameSequence: number = 0

  sectionHandler: Record<string, SectionHandler> = {
    MultiRowSection: this.handleMultiRowSection,
    SummarySection: this.handleSummarySection,
    MultiplicitySection: this.handleMultiplicitySection,
    ExecuteSection: this.handleExecuteSection,
    NeverExecuteSection: this.handleNeverExecuteSection,
    TagSection: this.handleTagSection,
    FilterSection: this.handleFilterSection,
    GeneratorSwitchSection: this.handleGeneratorSwitchSection,
    FieldSection: this.handleFieldSection
  }

  /**
   * Parses the sheet with the given name und uses the given importer to access
   * the data.
   * @param request - The parameters as defined in @see ParserParseRequest
   * @returns The created table model
   */
  parse(request: ParserParseRequest): TableInterface | undefined {
    const { fileName, importer, sheetName } = request
    this.logger.debug(`parseExcelSheet '${sheetName}'`)

    // Create a new table object
    const table: TableDecision = new TableDecision({
      tableName: sheetName,
      fileName,
      logger: this.logger
    })

    // get the last column of the testcases and also create empty testcase objects
    const testCaseEndColumn = this.parseForTestcases({
      table,
      sheetName,
      importer,
      testCaseStartColumn: START_COLUMN_TESTCASE,
      startRow: START_ROW
    })

    const sheetEndRow = this.getEndRow(importer, sheetName)

    let currentRow = DECISION_START_ROW // Start in the second line
    let processSheet = true
    do {
      const { startRow, endRow, sectionType } = this.getNextSection({
        importer,
        sheetEndRow,
        sheetName,
        startRow: currentRow
      })

      currentRow = endRow

      const sectionHandler = this.sectionHandler[sectionType]

      let sectionName = importer.cellValueString(
        sheetName,
        START_COLUMN,
        startRow
      )
      if (sectionName === undefined) {
        throw new Error(
          JSON.stringify(
            {
              message: `No section name defined in row '${startRow}'`,
              row: startRow,
              column: START_COLUMN,
              function: 'parseExcelSheet'
            },
            null,
            2
          )
        )
      }
      if (typeof sectionName === 'number') {
        sectionName = `${sectionName}`
      }

      this.logger.debug({
        message: `Handle section ${sectionType}`,
        function: 'parseExcelSheet',
        row: startRow,
        sheet: sheetName
      })

      sectionHandler.apply(this, [
        {
          table,
          sheetName,
          importer,
          sectionName,
          startRow,
          endRow,
          testCaseEndColumn
        }
      ])

      if (endRow >= sheetEndRow) {
        // this was the last section
        processSheet = false
      }
    } while (processSheet)

    this.updateTestcaseExecute(table)
    this.updateTestcaseNeverExecute(table)
    this.updateTestcaseMultiplicity(table)

    return table
  }

  /**
   * Creates a unique field name.
   * @returns the new generated fieldName
   */
  getFieldName() {
    this.fieldNameSequence++
    return `__Field_${this.fieldNameSequence}`
  }

  /**
   * Reads the first line until no testcase name found. This
   * column is the last column which will be read. By the way create emtpy testcases
   * and add them to the table.
   * @param request - The parameter as defined
   * @returns The testcase end column
   */
  parseForTestcases(request: {
    /** The table object. The new model */
    table: TableDecision
    /** The name of the worksheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /**  The coumn in which the testcases starts */
    testCaseStartColumn: number
    /**  The row in which the testcase names are defined */
    startRow: number
  }): number {
    const { importer, sheetName, startRow, table, testCaseStartColumn } =
      request
    this.logger.debug(`Parse for testcase in sheet '${sheetName}'`)

    // The column offset
    let i = 0
    let testcaseName: string | undefined
    do {
      testcaseName = importer.cellValueString(
        sheetName,
        testCaseStartColumn + i,
        startRow
      )
      if (testcaseName !== undefined) {
        // There is a testcase lets create one and store it in the table
        table.addNewTestcase(testcaseName)
      }
      i++
    } while (testcaseName !== undefined)

    const endColumn = testCaseStartColumn + i - 1
    this.logger.info(
      `Read ${table.testcases.length} testcases from sheet ${sheetName}.`
    )
    this.logger.info(
      `Stop reading testcases in col:${endColumn} / row:${startRow}.`
    )
    return endColumn
  }
  /**
   * After the table was loaded it must be checked if there is a 'ExecuteSection'.
   * If so the values must be set in the testcase.execute property
   * @param table - The table to be updated
   */
  private updateTestcaseExecute(table: TableDecision) {
    const section = table.singleCheck.get(SectionType.EXECUTE_SECTION)
    if (section !== undefined) {
      for (const key of Object.keys(table.testcases)) {
        const testcase = table.testcases[key]
        // Get the value from the testcase for this section
        const val = testcase.data[section.headerRow]
        testcase.execute = this.getBoolean(val)
      }
    }
  }

  /**
   * After the table was loaded it must be checked if there is a 'ExecuteSection'.
   * If so the values must be set in the testcase.execute property
   * @param table - The table to be updated
   */
  private updateTestcaseNeverExecute(table: TableDecision): void {
    const section = table.singleCheck.get(SectionType.NEVER_EXECUTE_SECTION)
    if (section !== undefined) {
      for (const key of Object.keys(table.testcases)) {
        const testcase = table.testcases[key]
        // Get the value from the testcase for this section
        const val = testcase.data[section.headerRow]
        testcase.neverExecute = this.getBoolean(val)
      }
    }
  }

  /**
   * Converts a string value into a boolen value
   * @param val - The value to be checked for a boolean
   * @returns true is the string is a true value else false
   */
  private getBoolean(val: string | number | boolean | undefined): boolean {
    if (val === undefined) {
      return false
    }
    if (typeof val === 'boolean') {
      return val
    }
    if (typeof val === 'number') {
      if (val > 0) {
        return true
      }
      return false
    }
    if (val.match(/^[tyj]$|^1$|^yes$|^ja$|^si$|^true$|^ok$/i)) {
      return true
    }
    return false
  }

  /**
   * If this section exists the multiplicity of an testcase must be updated
   * @param table - The table to be updated
   */
  private updateTestcaseMultiplicity(table: TableDecision) {
    const section = table.singleCheck.get(SectionType.MULTIPLICITY_SECTION)
    if (section !== undefined) {
      for (const key of Object.keys(table.testcases)) {
        const testcase = table.testcases[key]
        // Get the value from the testcase for this section
        const val = testcase.data[section.headerRow]
        testcase.multiplicity = this.getMultiplicityFromValue(val)
      }
    }
  }

  /**
   * Tries to convert a string into a multiplicity value
   * @param val - The value to be checked for number
   * @returns The number. If the string could not be parsed it will return 1
   */
  private getMultiplicityFromValue(val: string | number) {
    if (typeof val === 'number') {
      return val
    }
    if (val !== undefined) {
      try {
        const i = parseInt(val, 10)

        if (!isNaN(i) && i > 0) {
          return i
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // nothing to do
      }
    }
    return 1
  }

  /**
   * Adds a new MultiRowSection to the table. Updates the data for all the testcases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleMultiRowSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow, endRow } = opts

    // create new section
    const section: MultiRowSectionDefinition =
      table.addNewMultiRowSection(sectionName)

    // add the rows
    for (let i = startRow + 1; i < endRow; i++) {
      const key = importer.cellValueString(sheetName, COLUMN_MURO_KEY, i)
      const comment = importer.cellValueString(
        sheetName,
        COLUMN_MURO_COMMENT,
        i
      )
      const other = importer.cellValueString(sheetName, COLUMN_MURO_OTHER, i)

      const rowId = section.createNewRow()
      if (key !== undefined) {
        section.keys[rowId] = key
      }
      if (comment !== undefined) {
        section.comments[rowId] = comment
      }
      if (other !== undefined) {
        section.others[rowId] = other
      }

      this.readTestcaseValues({ table, sheetName, importer, row: i, rowId })
    }
  }

  /**
   * Adds a new TagSection to the table. Updates the data for all the test cases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleTagSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow, endRow } = opts

    // create new section
    const section = table.addNewTagSection(sectionName)

    // add the rows
    for (let i = startRow + 1; i < endRow; i++) {
      const tag = importer.cellValueString(sheetName, COLUMN_MURO_KEY, i)
      const comment = importer.cellValueString(
        sheetName,
        COLUMN_MURO_COMMENT,
        i
      )
      const other = importer.cellValueString(sheetName, COLUMN_MURO_OTHER, i)

      const rowId = section.createNewRow()
      if (tag !== undefined) {
        section.tags[rowId] = tag
      }
      if (comment !== undefined) {
        section.comments[rowId] = comment
      }
      if (other !== undefined) {
        section.others[rowId] = other
      }

      this.readTestcaseValues({ table, sheetName, importer, row: i, rowId })
    }
  }

  /**
   * Adds a new TagSection to the table. Updates the data for all the test cases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleFilterSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow, endRow } = opts

    // create new section
    const section = table.addNewFilterSection(sectionName)

    // add the rows
    for (let i = startRow + 1; i < endRow; i++) {
      const filterProcessorName = importer.cellValueString(
        sheetName,
        COLUMN_MURO_KEY,
        i
      )
      const expression = importer.cellValueString(
        sheetName,
        COLUMN_MURO_OTHER,
        i
      )
      const comment = importer.cellValueString(
        sheetName,
        COLUMN_MURO_COMMENT,
        i
      )

      const rowId = section.createNewRow()
      if (filterProcessorName !== undefined) {
        section.filterProcessorNames[rowId] = filterProcessorName
      }
      if (expression !== undefined) {
        section.expressions[rowId] = expression
      }
      if (comment !== undefined) {
        section.comments[rowId] = comment
      }

      this.readTestcaseValues({ table, sheetName, importer, row: i, rowId })
    }
  }

  /**
   * Adds a new GeneratorSwitch to the table. Updates the data for all the test cases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleGeneratorSwitchSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow, endRow } = opts

    // create new section
    const section = table.addNewGeneratorSwitchSection(sectionName)

    // add the rows
    for (let i = startRow + 1; i < endRow; i++) {
      const generatorName = importer.cellValueString(
        sheetName,
        COLUMN_MURO_KEY,
        i
      )
      const values = importer.cellValueString(sheetName, COLUMN_MURO_OTHER, i)
      const comment = importer.cellValueString(
        sheetName,
        COLUMN_MURO_COMMENT,
        i
      )

      const rowId = section.createNewRow()
      if (generatorName !== undefined) {
        section.generatorNames[rowId] = generatorName
      }
      if (values !== undefined) {
        section.values[rowId] = values
      }
      if (comment !== undefined) {
        section.comments[rowId] = comment
      }

      this.readTestcaseValues({ table, sheetName, importer, row: i, rowId })
    }
  }

  /**
   * Adds a new SummarySection to the table. Updates the data for all the testcases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleMultiplicitySection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow } = opts
    const sectionDefinition = table.addNewMultiplicitySection(sectionName)
    this.readTestcaseValues({
      table,
      sheetName,
      importer,
      row: startRow,
      rowId: sectionDefinition.headerRow
    })
  }

  /**
   * Adds a new ExecuteSection to the table. Updates the data for all the testcases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleExecuteSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow } = opts
    const sectionDefinition = table.addNewExecuteSection(sectionName)
    this.readTestcaseValues({
      table,
      sheetName,
      importer,
      row: startRow,
      rowId: sectionDefinition.headerRow
    })
  }

  /**
   * Adds a new NeverExecuteSection to the table. Updates the data for all the testcases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleNeverExecuteSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow } = opts
    const sectionDefinition = table.addNewNeverExecuteSection(sectionName)
    this.readTestcaseValues({
      table,
      sheetName,
      importer,
      row: startRow,
      rowId: sectionDefinition.headerRow
    })
  }

  /**
   * Adds a new SummarySection to the table. Updates the data for all the testcases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleSummarySection(opts: SectionHandlerOptions): void {
    const { table, sectionName } = opts
    table.addNewSummarySection(sectionName)
  }

  /**
   * Adds a new FieldSection to the table. Updates the data for all the testcases
   * @param opts - The parameter as defined in @see SectionHandlerOptions
   */
  handleFieldSection(opts: SectionHandlerOptions): void {
    const { table, sheetName, importer, sectionName, startRow, endRow } = opts

    // first add the fieldSection itself
    const fieldSectionDefinition = table.addNewFieldSection(sectionName)

    // now add the subSections
    let currentRow = startRow + 1
    do {
      // get the ranges of one subSection
      const {
        startRow: fieldStartRow,
        endRow: fieldEndRow,
        fieldName
      } = this.getNextSubSection({
        sheetName,
        importer,
        startRow: currentRow,
        sectionEndRow: endRow
      })

      const key = `FieldSubSection_${fieldName}`
      if (table.sectionNames.has(key)) {
        this.logger.error({
          message: `Double FieldSubSection name '${fieldName}' in section '${sectionName}' in table '${sheetName}'`,
          function: 'handleFieldSection',
          row: currentRow + 1,
          column: COLUMN_TYPE
        })
      } else {
        table.sectionNames.add(key)
      }

      // create a new subSection
      const subSectionDefinition =
        fieldSectionDefinition.createNewField(fieldName)
      subSectionDefinition.name = importer.cellValueString(
        sheetName,
        START_COLUMN,
        currentRow
      )

      // get the data for the subSectionDefinition
      for (let row = fieldStartRow + 1; row < fieldEndRow; row++) {
        const eqClass = importer.cellValueString(
          sheetName,
          COLUMN_FIELD_EQ_CLASS,
          row
        )
        const comment = importer.cellValueString(
          sheetName,
          COLUMN_FIELD_COMMENT,
          row
        )
        const tdg = importer.cellValueString(sheetName, COLUMN_FIELD_TDG, row)

        const rowId = subSectionDefinition.createNewRow()
        if (eqClass !== undefined) {
          subSectionDefinition.equivalenceClasses[rowId] = eqClass
        }
        if (comment !== undefined) {
          subSectionDefinition.comments[rowId] = comment
        }
        if (tdg !== undefined) {
          subSectionDefinition.tdgs[rowId] = tdg
        }

        this.readTestcaseValues({ table, sheetName, importer, row, rowId })
      }

      currentRow = fieldEndRow
    } while (currentRow < endRow)
  }

  /**
   * reads the data for the testcases from the spreadsheet
   * @param request - The parameters as defined
   */
  private readTestcaseValues(request: {
    /** The table to store the current sheet data */
    table: TableDecision
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The row where to read the data */
    row: number
    /** The uuid of this row */
    rowId: string
  }): void {
    const { table, sheetName, importer, row, rowId } = request
    for (let tc = 0; tc < table.testcaseOrder.length; tc++) {
      const testcaseId = table.testcaseOrder[tc]
      const testcase = table.testcases[testcaseId]
      const value = importer.cellValueString(
        sheetName,
        START_COLUMN_TESTCASE + tc,
        row
      )
      testcase.setValue(rowId, value)
    }
  }

  /**
   * Get the definition of the next sub section
   * @param request - The parameter as defined
   * @returns A definition/boundaries of this subSection \{ startRow, endRow, fieldName \}
   */
  getNextSubSection(request: {
    /** The name of the sheet */
    sheetName: string

    /** The importer */
    importer: ImporterInterface

    /** The row where to start searching */
    startRow: number

    /** The last row in the parent section */
    sectionEndRow: number
  }): NextSubSectionResult {
    const { importer, sectionEndRow, sheetName, startRow } = request

    let sectionType: string | undefined
    let currentRow = startRow
    let subSectionStartRow: number | undefined
    let subSectionName: string | undefined
    let subSectionEndRow: number | undefined
    do {
      sectionType = importer.cellValueString(sheetName, COLUMN_TYPE, currentRow)
      if (sectionType !== undefined) {
        // this is a new subSection
        if (subSectionStartRow === undefined) {
          // ok, this is the start of a section
          subSectionStartRow = currentRow
          subSectionName = importer.cellValueString(
            sheetName,
            START_COLUMN,
            currentRow
          )
          if (subSectionName === undefined) {
            this.logger.error({
              message: `No field name defined.`,
              function: 'getNextSubSection',
              row: currentRow,
              column: COLUMN_TYPE
            })
            // create a unique fielName
            subSectionName = this.getFieldName()
          }
        } else {
          // this is be the start of the next section
          subSectionEndRow = currentRow
        }
      }
      currentRow++
    } while (subSectionEndRow === undefined && currentRow < sectionEndRow)
    if (subSectionEndRow === undefined) {
      // this was the last sectionEndRow
      subSectionEndRow = sectionEndRow
    }

    if (subSectionStartRow === undefined) {
      throw new Error("The 'subSectionStartRow' is undefined")
    }
    if (subSectionName === undefined) {
      throw new Error("The 'subSectionName' is undefined")
    }

    return {
      startRow: subSectionStartRow,
      endRow: subSectionEndRow,
      fieldName: subSectionName
    }
  }

  /**
   * Get the definition of the next section
   * @param request - The parameter as defined
   * @returns  The created table model for the sheet
   */
  getNextSection(request: {
    /** The name of the sheet */
    sheetName: string

    /** The importer */
    importer: ImporterInterface

    /** The row where to start searching */
    startRow: number

    /** The last row in this sheet */
    sheetEndRow: number
  }): NextSectionResult {
    const { importer, sheetEndRow, sheetName, startRow } = request

    let isError = false
    let sectionType: string | undefined
    let firstColCell: string | undefined
    let currentRow = startRow
    let sectionStartRow: number | undefined
    let sectionStartType
    let sectionEndRow: number | undefined
    do {
      sectionType = importer.cellValueString(sheetName, COLUMN_TYPE, currentRow)
      firstColCell = importer.cellValueString(
        sheetName,
        START_COLUMN,
        currentRow
      )
      if (
        firstColCell !== undefined &&
        sectionType === undefined &&
        currentRow > START_ROW + 1
      ) {
        this.logger.error({
          message: `If a name is entered in column '${START_COLUMN}' a sectionType must be probvided in column '${COLUMN_TYPE}'`,
          function: 'getNextSection',
          row: currentRow,
          column: START_COLUMN
        })
        isError = true
      }

      if (sectionType !== undefined) {
        if (
          this.sectionHandler[sectionType] !== undefined ||
          sectionType === SectionType.FIELD_SUB_SECTION
        ) {
          if (sectionType !== SectionType.FIELD_SUB_SECTION) {
            // valid section found.
            if (sectionStartRow === undefined) {
              // ok, this is the start of a section
              sectionStartRow = currentRow
              sectionStartType = sectionType
            } else {
              // this is be the start of the next section
              sectionEndRow = currentRow
            }
          }
        } else {
          // invalid section type found
          this.logger.error({
            message: `Invalid section type '${sectionType}' found.`,
            function: 'getNextSection',
            row: currentRow,
            column: COLUMN_TYPE
          })
          isError = true
        }
      }
      currentRow++
    } while (sectionEndRow === undefined && currentRow < sheetEndRow)
    if (sectionEndRow === undefined) {
      // this was the last sectionEndRow
      sectionEndRow = sheetEndRow
    }

    if (isError) {
      throw new Error(`Could not parse the sheet beacause of the found errors!`)
    }

    this.logger.info({
      message: `${sheetName}: Section '${sectionStartType}' from '${sectionStartRow}' to '${sectionEndRow}'`,
      function: 'getNextSection'
    })

    if (sectionStartRow === undefined) {
      throw new Error("The 'sectionStartRow' is undefined")
    }
    if (sectionStartType === undefined) {
      throw new Error("The 'sectionStartType' is undefined")
    }

    return {
      startRow: sectionStartRow,
      endRow: sectionEndRow,
      sectionType: sectionStartType
    }
  }
}
