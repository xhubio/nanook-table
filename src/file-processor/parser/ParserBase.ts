import type { LoggerInterface } from '../../logger/index.js'
import type { TableInterface } from '../../model/index.js'

import {
  START_ROW,
  START_COLUMN,
  KEY_TABLE_END,
  MAX_EMPTY_LINES
} from '../constants/ParserBaseConstants.js'
import type { ParserParseRequest } from './ParserInterface.js'
import type { ParserInterface } from './ParserInterface.js'
import type { ImporterInterface } from '../../importer-xlsx/index.js'

export interface ParserBaseOptions {
  /** The row the parser will start reading. */
  startRow?: number

  /** The column the parser will start reading. */
  startColumn?: number

  /** The key string used to find the last column or row. */
  endKey?: string

  /** The logger used for this parser */
  logger: LoggerInterface
}

/**
 * For each different type of table an own parser is needed. This is the
 * base implementation of the parser used by different parser types.
 */
export abstract class ParserBase implements ParserInterface {
  /** The row the parser will start reading. */
  startRow: number

  /** The column the parser will start reading. */
  startColumn: number

  /** The key string used to find the last column or row. */
  endKey: string

  /** The logger used for this parser */
  logger: LoggerInterface

  /**
   * @param opts - The options as defined in @see ParserBaseOptions
   */
  constructor(opts: ParserBaseOptions) {
    const { logger, endKey, startColumn, startRow } = opts

    /** The logger used for this parser */
    this.logger = logger

    /** The row the parser will start. */
    this.startRow = startRow ?? START_ROW

    /** The column the parser will start. */
    this.startColumn = startColumn ?? START_COLUMN

    /** The key string used to find the last column or row. */
    this.endKey = endKey ?? KEY_TABLE_END
  }

  /**
   * Parses the sheet with the given name und uses the given importer to access
   * the data.
   * @param request - The parameters as defined in @see ParserParseRequest
   * @returns The created table model
   */
  abstract parse(request: ParserParseRequest): TableInterface | undefined

  /**
   * Parses the sheet to get the last row of the imported table.
   * @param importer - The importer object
   * @param sheetName - The name of the sheet to parse
   * @param maxEmpty - The maximum of empty lines which will be ignored
   * @returns The index number of the last row of the table
   */
  getEndRow(
    importer: ImporterInterface,
    sheetName: string,
    maxEmpty: number = MAX_EMPTY_LINES
  ): number {
    let row = this.startRow + 1
    let emptyLines = 0
    let endRow = 0
    do {
      const val = importer.cellValue(sheetName, this.startColumn, row)
      if (val === undefined) {
        emptyLines++
      } else {
        emptyLines = 0
        if (val === this.endKey) {
          endRow = row
        }
      }

      row++
    } while (endRow === 0 && emptyLines < maxEmpty)

    if (endRow === 0) {
      throw new Error(
        `SheetEndRow: Could not find the end sheet identifier '${this.endKey}' in the sheet '${sheetName}' in column '${this.startColumn}'`
      )
    } else {
      this.logger.info(
        `SheetEndRow: Detect sheetEnd '${this.endKey}' in row '${endRow}'`
      )
    }

    return endRow
  }

  /**
   * Parses the sheet to get the last column of the decision table.
   * @param importer - The importer object
   * @param sheetName - The name of the sheet to parse
   * @param maxEmpty - The maximum of empty columns which will be ignored
   * @returns - The index number of the last column of the table
   */
  getEndColumn(
    importer: ImporterInterface,
    sheetName: string,
    maxEmpty: number = 20
  ): number {
    let column = this.startColumn + 1
    let emptyLines = 0
    let endColumn = 0
    do {
      const val = importer.cellValue(sheetName, column, this.startRow)
      if (val === undefined) {
        emptyLines++
      } else {
        emptyLines = 0
        if (val === this.endKey) {
          endColumn = column
        }
      }

      column++
    } while (endColumn === 0 && emptyLines < maxEmpty)

    if (endColumn === 0) {
      throw new Error(
        `SheetEndColumn: Could not find the end sheet identifier '${this.endKey}' in the sheet '${sheetName}' in row '${this.startRow}'`
      )
    } else {
      this.logger.info(`Detect sheetEnd '${this.endKey}' in row '${endColumn}'`)
    }

    return endColumn
  }
}
