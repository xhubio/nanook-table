import { ParserBase } from './ParserBase.js'

import { TableMatrix } from '../../model-matrix/index.js'
import type { MetaRowColumn } from '../../model-matrix/index.js'

import {
  START_COLUMN_DATA,
  START_ROW_DATA,
  COLUMN_NAME,
  ROW_NAME,
  COLUMN_SHORT_NAME,
  ROW_SHORT_NAME,
  COLUMN_POSITION_NAME,
  ROW_POSITION_NAME,
  COLUMN_EXECUTE,
  ROW_EXECUTE,
  COLUMN_GENERATOR,
  ROW_GENERATOR,
  COLUMN_DESCRIPTION,
  ROW_DESCRIPTION
} from '../constants/ParserMatrixConstants.js'

import { START_ROW, START_COLUMN } from '../constants/ParserBaseConstants.js'
import type { TableInterface } from '../../model/index.js'
import type { ImporterInterface } from '../../importer-xlsx/index.js'
import type { ParserParseRequest } from './ParserInterface.js'

const META_ROWS: Record<string, number> = {
  name: ROW_NAME,
  shortName: ROW_SHORT_NAME,
  position: ROW_POSITION_NAME,
  execute: ROW_EXECUTE,
  generator: ROW_GENERATOR,
  description: ROW_DESCRIPTION
}

const META_COLUMNS: Record<string, number> = {
  name: COLUMN_NAME,
  shortName: COLUMN_SHORT_NAME,
  position: COLUMN_POSITION_NAME,
  execute: COLUMN_EXECUTE,
  generator: COLUMN_GENERATOR,
  description: COLUMN_DESCRIPTION
}

/**
 * The parser for the matrix tables.
 */
export class ParserMatrix extends ParserBase {
  /** This sequence is used to give each field a unique name. */
  fieldNameSequence: number = 0

  /** If a complete column is empty, it must not be parsed */
  emptyColumns: Set<number> = new Set<number>()
  /** If a complete row is empty, it must not be parsed */
  emptyRows: Set<number> = new Set<number>()

  /**
   * Parses the sheet with the given name und uses the given importer to access
   * the data.
   * @param request - The parameters as defined in @see ParserParseRequest
   * @returns The created table model
   */
  parse(request: ParserParseRequest): TableInterface | undefined {
    const { fileName, importer, sheetName } = request
    this.logger.debug(`parseExcelSheet '${sheetName}'`)

    this.emptyColumns = new Set<number>()
    this.emptyRows = new Set<number>()

    // Create a new table object
    const table = new TableMatrix({
      tableName: sheetName,
      fileName,
      logger: this.logger
    })

    const sheetEndRow = this.getEndRow(importer, sheetName)
    const sheetEndColumn = this.getEndColumn(importer, sheetName)

    const statusMetaColumn = this.checkMetaDataColumn({ importer, sheetName })
    const statusMetaRow = this.checkMetaDataRow({ importer, sheetName })
    if (!statusMetaColumn || !statusMetaRow) {
      // there is an error in naming the headers. So no table could be created
      return
    }

    this.parseMetaDataColumn({
      table,
      sheetName,
      importer,
      sheetEndColumn,
      sheetEndRow
    })
    this.parseMetaDataRow({
      table,
      sheetName,
      importer,
      sheetEndColumn,
      sheetEndRow
    })
    this.parseFieldData({
      table,
      sheetName,
      importer,
      sheetEndColumn,
      sheetEndRow
    })

    return table
  }

  /**
   * Creates a unique field name.
   * @returns The new generated fieldName
   */
  getFieldName(): string {
    this.fieldNameSequence++
    return `__Field_${this.fieldNameSequence}`
  }

  /**
   * This function checks that the column header of the meta data is valid
   * @param request - The parameters as defined
   * @returns true if there is no error
   */
  private checkMetaDataColumn(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
  }): boolean {
    const { importer, sheetName } = request

    let statusMetaColumn = true

    const rowNumber = START_ROW
    for (const columnName of Object.keys(META_COLUMNS)) {
      const columnNumber = META_COLUMNS[columnName]
      const val = importer.cellValueString(sheetName, columnNumber, rowNumber)
      if (val === undefined) {
        this.logger.error({
          message: `The cell column:'${columnNumber}' row:'${rowNumber}' must not be empty`,
          function: 'checkMetaDataColumn',
          row: rowNumber,
          column: columnNumber
        })
        statusMetaColumn = false
      } else if (val.toLocaleLowerCase() !== columnName.toLocaleLowerCase()) {
        this.logger.error({
          message: `The cell column:'${columnNumber}' row:'${rowNumber}' must have the name '${columnName}`,
          function: 'checkMetaDataColumn',
          row: rowNumber,
          column: columnNumber
        })
        statusMetaColumn = false
      }
    }

    return statusMetaColumn
  }

  /**
   * This function checks that the row header of the meta data is valid
   * @param request - The parameters as defined
   * @returns true if there is no error
   */
  private checkMetaDataRow(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
  }): boolean {
    const { importer, sheetName } = request

    let statusMetaRow = true

    const columnNumber = START_COLUMN
    for (const rowName of Object.keys(META_ROWS)) {
      const rowNumber = META_ROWS[rowName]
      const val = importer.cellValueString(sheetName, columnNumber, rowNumber)
      if (val === undefined) {
        this.logger.error({
          message: `The cell column:'${columnNumber}' row:'${rowNumber}' must not be empty`,
          function: 'checkMetaDataRow',
          row: rowNumber,
          column: columnNumber
        })
        statusMetaRow = false
      } else if (val.toLocaleLowerCase() !== rowName.toLocaleLowerCase()) {
        this.logger.error({
          message: `The cell column:'${columnNumber}' row:'${rowNumber}' must have the name '${rowName}`,
          function: 'checkMetaDataColumn',
          row: rowNumber,
          column: columnNumber
        })
        statusMetaRow = false
      }
    }

    return statusMetaRow
  }

  /**
   * Reads the meta data information of each column and stores it in the
   * table object
   * @param request - The parameter as defined
   */
  parseMetaDataColumn(request: {
    /** The table to store the current sheet data */
    table: TableMatrix
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The last column of the sheed (Exclusive) */
    sheetEndColumn: number
    /** The last row of the sheet (Exclusive) */
    sheetEndRow: number
  }): void {
    const { importer, sheetEndColumn, sheetEndRow, sheetName, table } = request

    for (
      let column: number = START_COLUMN_DATA;
      column < sheetEndColumn;
      column++
    ) {
      const meta: Record<string, string | number | undefined> = {}

      for (const key of Object.keys(META_ROWS)) {
        const rowNumber = META_ROWS[key]
        const val = importer.cellValue(sheetName, column, rowNumber)

        if (key === 'name' && (val === '' || val === undefined)) {
          // in this case the complete column must be null
          this.checkForEmptyColumn({
            sheetName,
            importer,
            column,
            sheetEndRow
          })
          this.emptyColumns.add(column)
        }
        meta[key] = val
      }

      table.columns.push(meta as unknown as MetaRowColumn)
    }
  }

  /**
   * Checks that the complete row is empty.
   * If the column has no name, then the complete row must be null
   * @param request - The parameter as defined
   */
  private checkForEmptyColumn(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The current column */
    column: number
    /** The last row of the sheet (Exclusive) */
    sheetEndRow: number
  }): void {
    const { sheetName, importer, column, sheetEndRow } = request

    for (let row: number = START_ROW; row < sheetEndRow; row++) {
      const val = importer.cellValueString(sheetName, column, row)
      if (val !== undefined && val !== '') {
        this.logger.error({
          message: `If the name is null there must be no data for the complete column`,
          function: '_checkForEmptyColumn',
          row,
          column
        })
      }
    }
  }

  /**
   * Reads the meta data information of each row and stores it in the
   * table object
   * @param request - the parameter as defined
   */
  private parseMetaDataRow(request: {
    /** The table to store the current sheet data */
    table: TableMatrix
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The last column of the sheed (Exclusive) */
    sheetEndColumn: number
    /** The last row of the sheet (Exclusive) */
    sheetEndRow: number
  }): void {
    const { table, sheetName, importer, sheetEndColumn, sheetEndRow } = request

    for (let row: number = START_ROW_DATA; row < sheetEndRow; row++) {
      const meta: Record<string, string | number> = {}

      for (const key of Object.keys(META_COLUMNS)) {
        const column = META_COLUMNS[key]
        const val = importer.cellValue(sheetName, column, row)

        if (key === 'name' && (val === '' || val === undefined)) {
          // in this case the complete column must be null
          this.checkForEmptyRow({ sheetName, importer, row, sheetEndColumn })
          this.emptyRows.add(row)
        }
        if (val !== undefined) {
          meta[key] = val
        }
      }
      if (!this.emptyRows.has(row)) {
        table.rows.push(meta as unknown as MetaRowColumn)
      }
    }
  }

  /**
   * Checks that the complete row is empty.
   * If the column has no name, then the complete row must be null
   * @param request - the parameter as defined
   */
  private checkForEmptyRow(request: {
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The current row */
    row: number
    /** The last column of the sheet (Exclusive) */
    sheetEndColumn: number
  }): void {
    const { sheetName, importer, row, sheetEndColumn } = request

    for (let column: number = START_COLUMN; column < sheetEndColumn; column++) {
      const val = importer.cellValue(sheetName, column, row)
      if (val !== undefined && val !== '' && val !== undefined) {
        this.logger.error({
          message: `If the name is null there must be no data for the complete row`,
          function: '_checkForEmptyRow',
          row,
          column
        })
      }
    }
  }

  /**
   * Reads the data section of the matrix table
   * @param request - The parameter as defined
   */
  private parseFieldData(request: {
    /** The table to store the current sheet data */
    table: TableMatrix
    /** The name of the sheet */
    sheetName: string
    /** The importer */
    importer: ImporterInterface
    /** The last column of the sheed (Exclusive) */
    sheetEndColumn: number
    /** The last row of the sheet (Exclusive) */
    sheetEndRow: number
  }): void {
    const { table, sheetName, importer, sheetEndColumn, sheetEndRow } = request

    for (let row: number = START_ROW_DATA; row < sheetEndRow; row++) {
      const matrixData: (string | number | undefined)[] = []
      let hasData = false
      for (
        let column: number = START_COLUMN_DATA;
        column < sheetEndColumn;
        column++
      ) {
        const val = importer.cellValue(sheetName, column, row)
        matrixData.push(val)
        if (val !== undefined) {
          hasData = true
        }
      }
      if (hasData) {
        table.data.push(matrixData)
      }
    }
  }
}
