import {
  MetaTable,
  TableInterface,
  TestcaseDefinitionInterface
} from '../model/index.js'
import { LoggerInterface } from '../logger/index.js'
import { MetaRowColumn } from './Meta.js'
import { TestcaseDefinitionMatrix } from './TestcaseDefinitionMatrix.js'
import { TABLE_TYPE_MATRIX_TABLE } from './constants.js'

/**
 * Options for initializing a TableMatrix.
 */
export interface TableMatrixOptions {
  /**
   * The file name of the table.
   */
  fileName: string

  /**
   * The human-readable name of the table.
   */
  tableName: string

  /**
   * Logger instance for logging operations.
   */
  logger: LoggerInterface

  /**
   * An array of meta information for each row.
   */
  rows?: MetaRowColumn[]

  /**
   * An array of meta information for each column.
   */
  columns?: MetaRowColumn[]

  /**
   * The matrix data stored as an array of arrays.
   * Each inner array represents a row, with column data.
   */
  data?: (string | undefined | number)[][]
}

/**
 * Represents a matrix table.
 *
 * The TableMatrix class implements the TableInterface for matrix-style tables.
 * It stores the table meta information, row and column meta data, and the actual data matrix.
 */
export class TableMatrix implements TableInterface {
  /**
   * The type of the table, set to TABLE_TYPE_MATRIX_TABLE.
   */
  readonly tableType: string = TABLE_TYPE_MATRIX_TABLE

  /** Logger instance used for logging. */
  logger: LoggerInterface

  /** The file name of the table. */
  fileName: string

  /** The human-readable name of the table. */
  tableName: string

  /** Array of meta information for the rows. */
  rows: MetaRowColumn[] = []

  /** Array of meta information for the columns. */
  columns: MetaRowColumn[] = []

  /**
   * The matrix data stored as an array of arrays.
   * Each inner array represents a row, containing data for each column.
   */
  data: (string | undefined | number)[][] = []

  /**
   * Constructs a new TableMatrix.
   *
   * @param opts - Options for initializing the TableMatrix, including file name, table name, logger, rows, columns, and data.
   */
  constructor(opts: TableMatrixOptions) {
    this.fileName = opts.fileName
    this.tableName = opts.tableName
    this.logger = opts.logger

    if (opts.rows !== undefined) {
      this.rows = opts.rows
    }
    if (opts.columns !== undefined) {
      this.columns = opts.columns
    }
    if (opts.data !== undefined) {
      this.data = opts.data
    }
  }

  /**
   * Retrieves the meta information of the table.
   *
   * @returns A MetaTable object containing the file name, table name, and table type.
   */
  get tableMeta(): MetaTable {
    return {
      fileName: this.fileName,
      tableName: this.tableName,
      tableType: this.tableType
    }
  }

  /**
   * Returns the test case for the given name.
   *
   * The test case name in a matrix table follows the format: 'r<row>:c<column>'.
   * This method parses the test case name, extracts the row and column numbers,
   * and creates a new TestcaseDefinitionMatrix instance based on the corresponding data.
   *
   * @param testcaseName - The test case name in the format 'r<row>:c<column>'.
   * @returns The corresponding TestcaseDefinitionMatrix.
   * @throws Error if the test case name is invalid or out of range.
   */
  getTestcaseForName(testcaseName: string): TestcaseDefinitionInterface {
    const parts = testcaseName.match(/r(\d+):c(\d+)/)
    if (parts === null) {
      throw new Error(
        `The testcase name '${testcaseName}' is not valid. The name must have the format: 'r<row>:c<column>'`
      )
    }

    const rowNumber = parseInt(parts[1])
    const columnNumber = parseInt(parts[2])

    if (rowNumber >= this.rows.length || columnNumber >= this.columns.length) {
      throw new Error(`The testcase name '${testcaseName}' is out of range`)
    }

    const fileName = this.tableMeta?.fileName
      ? this.tableMeta.fileName
      : 'Unknown'

    const tc = new TestcaseDefinitionMatrix({
      rowNumber,
      columnNumber,
      data: this.data[rowNumber][columnNumber],
      logger: this.logger,
      tableMeta: {
        fileName,
        tableName: this.tableMeta.tableName,
        tableType: this.tableMeta.tableType
      },
      rowMeta: this.rows[rowNumber],
      columnMeta: this.columns[columnNumber],
      table: this
    })

    return tc
  }

  /**
   * Creates a test case name for the specified row and column numbers.
   *
   * @param rowNumber - The row number.
   * @param columnNumber - The column number.
   * @returns A test case name in the format 'r<row>:c<column>'.
   */
  createTestcaseName(rowNumber: number, columnNumber: number): string {
    return `r${rowNumber}:c${columnNumber}`
  }

  /**
   * Generator function that yields all test cases that should be executed.
   *
   * Iterates through the matrix data, creates test cases for each defined cell, and yields them.
   * For test cases with multiplicity greater than one, additional instances are generated with incremented names.
   *
   * @returns A generator yielding TestcaseDefinitionInterface instances.
   */
  *getTestcasesForExecution(): Generator<
    TestcaseDefinitionInterface,
    void,
    unknown
  > {
    for (let rowNumber = 0; rowNumber < this.data.length; rowNumber++) {
      const rowData = this.data[rowNumber]
      for (
        let columnNumber = 0;
        columnNumber < rowData.length;
        columnNumber++
      ) {
        const columnData = rowData[columnNumber]
        if (columnData !== undefined && columnData !== '') {
          const testcaseName = this.createTestcaseName(rowNumber, columnNumber)
          const testcaseDefinition = this.getTestcaseForName(testcaseName)

          // Check if the test case should be executed.
          if (testcaseDefinition.execute) {
            // If multiplicity is greater than one, update the test case name for the first instance.
            if (testcaseDefinition.multiplicity > 1) {
              testcaseDefinition.testcaseMeta.testcaseName = `${testcaseName}.1`
            }
            yield testcaseDefinition
            // Generate additional instances if multiplicity is greater than one.
            for (let i = 1; i < testcaseDefinition.multiplicity; i++) {
              const td = this.getTestcaseForName(testcaseName)
              if (testcaseDefinition.multiplicity > 1) {
                td.testcaseMeta.testcaseName = `${testcaseName}.${i + 1}`
              }
              yield td
            }
          }
        }
      }
    }
    return
  }

  /**
   * Parses a test case name provided as a reference.
   *
   * The method supports both single test case names (e.g., "r5:c3") and ranges.
   * For a range, such as "[r2:c1-r4:c1]", it expands the range into individual test case names.
   *
   * @param testcaseName - The reference test case name or range.
   * @returns An array of test case names.
   * @throws Error if the test case name format is invalid.
   */
  processRanges(testcaseName: string): string[] {
    let parts = testcaseName.match(/^\[?(r(\d+):c(\d+))\]?$/)
    if (parts !== null) {
      // Single test case name; return it as an array.
      return [parts[1]]
    }

    parts = testcaseName.match(/^\[r(\d+)(-(\d+))?:c(\d+)(-(\d+))?\]$/)
    if (parts !== null) {
      let rowStart: number = parseInt(parts[1])
      let rowEnd: number = parseInt(parts[3]) || rowStart
      let columnStart: number = parseInt(parts[4])
      let columnEnd: number = parseInt(parts[6]) || columnStart

      // Ensure row numbers are in ascending order.
      if (rowStart > rowEnd) {
        const tmp = rowStart
        rowStart = rowEnd
        rowEnd = tmp
      }

      // Ensure column numbers are in ascending order.
      if (columnStart > columnEnd) {
        const tmp = columnStart
        columnStart = columnEnd
        columnEnd = tmp
      }

      const tcNames: string[] = []

      for (let row = rowStart; row <= rowEnd; row++) {
        for (let column = columnStart; column <= columnEnd; column++) {
          tcNames.push(this.createTestcaseName(row, column))
        }
      }

      return tcNames
    }
    // If the format is invalid, throw an error.
    throw new Error(
      `The testcase name '${testcaseName}' is not valid. The name must have the format: 'r<row>:c<column>'`
    )
  }
}
