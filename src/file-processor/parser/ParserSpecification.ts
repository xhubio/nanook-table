import { ParserBase } from './ParserBase.js'
import { ParserSpecificationConverter } from './specificationConverter/ParserSpecificationConverter.js'

import { START_ROW, START_COLUMN } from '../constants/ParserBaseConstants.js'
import {
  KEY_SEVERITY,
  KEY_RULE,
  START_COLUMN_RULE
} from '../constants/ParserSpecificationConstants.js'
import type { TableInterface } from '../../model/index.js'
import type {
  SpecificationFieldInterface,
  SpecificationFieldRuleInterface,
  SpecificationInterface,
  SpecificationRuleInterface
} from './SpecificationInterface.js'
import type { ImporterInterface } from '../../importer-xlsx/index.js'
import type { ParserParseRequest } from './ParserInterface.js'

/**
 * The parser implementation to parse specification tables.
 */
export class ParserSpecification extends ParserBase {
  hasParseErrors: boolean = false

  /**
   * Parses the sheet with the given name und uses the given importer to access
   * the data.
   * @param request - The parameters as defined in @see ParserParseRequest
   * @returns The created table model
   */
  parse(request: ParserParseRequest): TableInterface | undefined {
    const { fileName, importer, sheetName } = request
    this.hasParseErrors = false

    try {
      const converter = new ParserSpecificationConverter()
      const specificationModel = this.parseSpecification(sheetName, importer)

      if (specificationModel !== undefined && !this.hasParseErrors) {
        return converter.convert({
          specification: specificationModel,
          logger: this.logger,
          fileName
        })
      }
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error({
          message: e.message,
          function: 'parse',
          sheet: sheetName,
          stack: e.stack
        })
      } else {
        this.logger.error({
          message: e,
          function: 'parse',
          sheet: sheetName
        })
      }
    }
  }

  /**
   * Parses a single Spreadsheet
   * @param sheetName - The name of the sheet
   * @param importer - The importer
   * @returns The created specification model for the sheet
   */
  parseSpecification(
    sheetName: string,
    importer: ImporterInterface
  ): SpecificationModel | undefined {
    this.logger.debug(`parseSpecification`)

    const specification = new SpecificationModel(sheetName)
    const sheetEndRow = this.getEndRow(importer, sheetName)
    const sheetEndColumn = this.getEndColumn(importer, sheetName)

    // get the sections and validate that all existing
    const { severityStartRow, ruleStartRow } = this.checkSheetRows(
      sheetName,
      importer,
      sheetEndRow
    )

    if (severityStartRow === 0 || ruleStartRow === 0) {
      // no furher parsing possible
      return
    }

    const parseFieldsResult: {
      fieldOrder: string[]
      fields: Record<string, SpecificationFieldInterface>
    } = this.parseFields({
      sheetName,
      importer,
      severityStartRow,
      ruleStartRow,
      sheetEndColumn
    })

    const rules: Record<string, SpecificationRuleInterface> = this.parseRules({
      sheetName,
      importer,
      ruleStartRow,
      endRow: sheetEndRow
    })

    const severities: Set<string> = this.parseSeverities({
      sheetName,
      importer,
      severityStartRow,
      ruleStartRow,
      sheetEndColumn
    })

    this.checkForUnusedRules({
      sheetName,
      importer,
      severityStartRow,
      sheetEndColumn,
      rules
    })

    specification.fieldOrder = parseFieldsResult.fieldOrder
    specification.fields = parseFieldsResult.fields
    specification.rules = rules

    severities.forEach((name) => {
      specification.severities.push(name)
    })

    return specification
  }

  /**
   * Parses the fields out of the Spreadsheet. This is the section where
   * the fields of the interface are defined
   * @param request - The Parameters as defined
   * @returns An object with the fields and the fieldOrder
   */
  parseFields(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The start row of the severities */
    severityStartRow: number
    /** The start row of the rules */
    ruleStartRow: number
    /** The last column of the sheet */
    sheetEndColumn: number
  }): {
    fieldOrder: string[]
    fields: Record<string, SpecificationFieldInterface>
  } {
    const {
      importer,
      ruleStartRow,
      severityStartRow,
      sheetEndColumn,
      sheetName
    } = request

    const self = this // eslint-disable-line @typescript-eslint/no-this-alias

    /**
     * Returns the severity for a given column
     * @param column - The column for which to get the severity
     * @returns  The severity for this field
     */
    function getSeverity(column: number): string | undefined {
      let severity
      for (let i = severityStartRow + 1; i < ruleStartRow; i++) {
        const val = importer.cellValueString(sheetName, column, i)
        if (val !== undefined && val !== '') {
          if (severity === undefined) {
            severity = importer.cellValueString(sheetName, START_COLUMN, i)
          } else {
            self.hasParseErrors = true

            self.logger.error({
              message: `The rule in column '${column}' has more than one severity asigned`,
              function: 'parseFields/getSeverity',
              row: i,
              sheet: sheetName
            })
          }
        }
      }

      if (severity === undefined) {
        self.hasParseErrors = true

        self.logger.error({
          message: `The rule in column '${column}' has no severity asigned`,
          function: 'parseFields/getSeverity',
          sheet: sheetName
        })
      }
      return severity
    }

    /**
     * Returns the complete field for a given row
     * @param row - The row to read
     * @returns  The field object
     */
    function getField(
      row: number,
      severityMap: Record<number, string | undefined>
    ): SpecificationFieldInterface | undefined {
      const name = importer.cellValueString(sheetName, START_COLUMN, row)
      const fieldNameInternal = importer.cellValueString(
        sheetName,
        START_COLUMN + 1,
        row
      )
      const rules: SpecificationFieldRuleInterface[] = []

      if (name === undefined || fieldNameInternal === undefined) {
        // the field name is mandatory field
        self.hasParseErrors = true
        self.logger.error({
          message: `In the row '${row}' there is no field name defined`,
          function: 'parseFields.getField',
          row,
          sheet: sheetName
        })
      } else {
        // now iterate the rules by column for one field
        for (let col: number = START_COLUMN + 2; col <= sheetEndColumn; col++) {
          const ruleName = importer.cellValueString(
            sheetName,
            col,
            START_ROW + 1
          )
          const value = importer.cellValueString(sheetName, col, row)
          const severity = severityMap[col]

          if (
            value !== undefined &&
            ruleName !== undefined &&
            severity !== undefined
          ) {
            rules.push({ ruleName, value, severity })
          }
        }

        if (rules.length === 0) {
          self.hasParseErrors = true
          self.logger.error({
            message: `No rules defined for the field '${fieldNameInternal}' or the rules are not complete.`,
            function: 'parseFields.getField',
            row,
            sheet: sheetName
          })
        }

        const field: SpecificationFieldInterface = {
          name,
          fieldNameInternal,
          rules
        }
        return field
      }
      return undefined
    }

    const fieldOrder: string[] = []
    const fields: Record<string, SpecificationFieldInterface> = {}

    // The serverity for each ro is the same. So we first get all Serverities for all the columns
    const serverityMap: Record<number, string | undefined> = {}
    for (let col: number = START_COLUMN + 2; col <= sheetEndColumn; col++) {
      serverityMap[col] = getSeverity(col)
    }

    let row = START_ROW + 2
    while (row < severityStartRow) {
      const field = getField(row, serverityMap)
      if (field !== undefined) {
        fieldOrder.push(field.name)
        fields[field.name] = field
      }
      row++
    }

    return { fieldOrder, fields }
  }

  /**
   * Load the rules defined in the rule section
   * @param request - The parameters as defined
   * @returns An object with the rules
   */
  parseRules(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The start row of the rules */
    ruleStartRow: number
    /** The end row of the rules */
    endRow: number
  }): Record<string, SpecificationRuleInterface> {
    const { sheetName, importer, ruleStartRow, endRow } = request

    const rules: Record<string, SpecificationRuleInterface> = {}

    let row = ruleStartRow + 1
    while (row < endRow) {
      const ruleName = importer.cellValueString(sheetName, START_COLUMN, row)
      const shortDesc = importer.cellValueString(
        sheetName,
        START_COLUMN + 1,
        row
      )
      const longDesc = importer.cellValueString(
        sheetName,
        START_COLUMN + 2,
        row
      )

      if (shortDesc === undefined) {
        this.hasParseErrors = true
        this.logger.error({
          message: `The short description for the rule '${ruleName}' is not defined`,
          function: 'parseRules',
          row,
          sheet: sheetName
        })
      }
      if (longDesc === undefined) {
        this.logger.warning({
          message: `The long description for the rule '${ruleName}' is not defined`,
          function: 'parseRules',
          row,
          sheet: sheetName
        })
      }

      if (ruleName === undefined) {
        this.hasParseErrors = true
        this.logger.error({
          message: `The rule name is not defined`,
          function: 'parseRules',
          row,
          sheet: sheetName
        })
      }

      if (
        ruleName !== undefined &&
        shortDesc !== undefined &&
        longDesc !== undefined
      ) {
        const rule: SpecificationRuleInterface = {
          ruleName,
          shortDesc,
          longDesc
        }

        if (rules[ruleName] !== undefined) {
          this.hasParseErrors = true
          this.logger.error({
            message: `The rule '${ruleName}' is double defined`,
            function: 'parseRules',
            row,
            sheet: sheetName
          })
        }

        rules[ruleName] = rule
      }

      row++
    }

    return rules
  }

  /**
   * Load the rules defined in the rule section
   * @param request - The parameters as defined
   * @returns A set of the existing severities
   */
  parseSeverities(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The start row of the severities */
    severityStartRow: number
    /** The start row of the rules */
    ruleStartRow: number
    /** The last column of the sheet */
    sheetEndColumn: number
  }): Set<string> {
    const {
      sheetName,
      importer,
      severityStartRow,
      ruleStartRow,
      sheetEndColumn
    } = request

    let row = severityStartRow + 1
    const severities: Set<string> = new Set<string>()
    while (row < ruleStartRow) {
      const severity: string | undefined = importer.cellValueString(
        sheetName,
        START_COLUMN,
        row
      )

      if (severity === undefined) {
        this.hasParseErrors = true
        // empty rows are an error
        this.logger.error({
          message: `In the row '${row}' is no severity name defined`,
          function: 'parseSeverities',
          row,
          sheet: sheetName
        })
      } else if (severities.has(severity)) {
        // this severity is double defined
        this.hasParseErrors = true
        this.logger.error({
          message: `The severity '${severity}' is double defined`,
          function: 'parseSeverities',
          row,
          sheet: sheetName
        })
      } else {
        // check that the severitiy has a minimum of one assigned rule
        let hasVal = false
        for (let col: number = START_COLUMN + 2; col <= sheetEndColumn; col++) {
          const val = importer.cellValueString(sheetName, col, row)
          if (val !== undefined) {
            hasVal = true
          }
        }
        if (!hasVal) {
          this.hasParseErrors = true
          this.logger.error({
            message: `The severity '${severity}' is not used`,
            function: 'parseSeverities',
            row,
            sheet: sheetName
          })
        }
      }
      if (severity !== undefined) {
        severities.add(severity)
      }
      row++
    }

    return severities
  }

  /**
   * Each rule defined must be used. Unused rules should be deleted from the table
   * @param request - The parameters as defined
   */
  checkForUnusedRules(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The start row of the severities */
    severityStartRow: number
    /** The last column of the sheet */
    sheetEndColumn: number
    /** The rules of the sheet */
    rules: Record<string, SpecificationRuleInterface>
  }): void {
    const { sheetName, importer, severityStartRow, sheetEndColumn, rules } =
      request

    const usedRulesSet: Set<string> = new Set<string>()

    for (let col: number = START_COLUMN + 2; col <= sheetEndColumn; col++) {
      const ruleName = importer.cellValueString(sheetName, col, START_ROW + 1)
      if (ruleName !== undefined) {
        usedRulesSet.add(ruleName)

        if (rules[ruleName] === undefined) {
          this.hasParseErrors = true
          this.logger.error({
            message: `The rule '${ruleName}' does not exists in the rule section`,
            function: 'checkForUnusedRules',
            sheet: sheetName
          })
        }

        let hasValue = false
        for (let row: number = START_ROW + 2; row < severityStartRow; row++) {
          const val = importer.cellValueString(sheetName, col, row)
          if (val !== undefined) {
            hasValue = true
          }
        }

        if (!hasValue) {
          this.hasParseErrors = true
          this.logger.error({
            message: `The rule '${ruleName}' is not used`,
            function: 'checkForUnusedRules',
            sheet: sheetName
          })
        }
      }
    }

    // now check that all the defined rules are also used
    for (const ruleName of Object.keys(rules)) {
      if (!usedRulesSet.has(ruleName)) {
        this.hasParseErrors = true
        this.logger.error({
          message: `The defined rule '${ruleName}' in the rule section is not used`,
          function: 'checkForUnusedRules',
          sheet: sheetName
        })
      }
    }
  }

  /**
   * Checks that the specification contains all the needed sections
   * @param sheetName - The name of the sheet
   * @param importer - The importer
   * @param sheetEndRow - The last row of the sheet
   * @returns An Object with the following properties \{severityStartRow, ruleStartRow\}
   */
  checkSheetRows(
    sheetName: string,
    importer: ImporterInterface,
    sheetEndRow: number
  ): { severityStartRow: number; ruleStartRow: number } {
    /** The start row of the severity section */
    let severityStartRow: number = 0

    /** The start row of the rule definition */
    let ruleStartRow = 0

    let row = START_ROW + 1
    while (row < sheetEndRow) {
      const val = importer.cellValueString(sheetName, START_COLUMN, row)
      if (val === KEY_SEVERITY) {
        severityStartRow = row
      } else if (val === KEY_RULE) {
        ruleStartRow = row
      }
      row++
    }

    if (severityStartRow === 0) {
      this.hasParseErrors = true
      this.logger.error({
        message: `The '${KEY_SEVERITY}' section could not be found`,
        function: 'checkSheetRows',
        sheet: sheetName
      })
    }
    if (ruleStartRow === 0) {
      this.hasParseErrors = true
      this.logger.error({
        message: `The '${KEY_RULE}' section could not be found`,
        function: 'checkSheetRows',
        sheet: sheetName
      })
    }

    return { severityStartRow, ruleStartRow }
  }

  /**
   * Parses the sheet to get the last row of the table.
   * @param importer - The importer
   * @param sheetName - The name of the sheet
   * @returns The last row of the table
   */
  getEndColumn(importer: ImporterInterface, sheetName: string) {
    const maxEmptyCol = 100
    const row = START_ROW + 1
    let endColumn = 0
    let column = START_COLUMN_RULE
    do {
      const val = importer.cellValueString(sheetName, column, row)
      if (val === undefined) {
        endColumn = column - 1
      }
      column++
    } while (endColumn === 0)

    if (endColumn < START_COLUMN_RULE) {
      // no rules defined
      throw new Error(
        `The specification sheet '${sheetName}' does not contain any rule`
      )
    }

    // check for empty columns
    let emptyColumnDetected = false
    for (let i = endColumn + 1; i < endColumn + maxEmptyCol; i++) {
      const val = importer.cellValueString(sheetName, i, row)
      if (val !== undefined && val !== '') {
        emptyColumnDetected = true
      }
    }

    if (emptyColumnDetected) {
      throw new Error(
        `The specification sheet '${sheetName}' contains empty rule columns`
      )
    }

    return endColumn
  }
}

/**
 * The model for a specification object
 */
export class SpecificationModel implements SpecificationInterface {
  name: string
  fieldOrder: string[] = []
  fields: Record<string, SpecificationFieldInterface> = {}
  severities: string[] = []
  rules: Record<string, SpecificationRuleInterface> = {}

  constructor(name: string) {
    this.name = name
  }
}
