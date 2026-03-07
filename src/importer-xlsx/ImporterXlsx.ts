import XLSX from 'xlsx'
import SpreadsheetColumn from 'spreadsheet-column'
import { ImporterInterface } from './ImporterInterface.js'
import { LoggerInterface, LoggerMemory } from '../logger/index.js'

/**
 * Options for initializing an ImporterXlsx instance.
 */
export interface ImporterXlsxOptions {
  /**
   * An optional logger instance. If not provided, a default LoggerMemory will be used.
   */
  logger?: LoggerInterface
}

/**
 * An importer for loading Excel spreadsheets.
 *
 * This class implements the ImporterInterface to load Excel files,
 * store the sheets internally, and provide access to individual cell values.
 * It uses the XLSX library to read the file and SpreadsheetColumn to convert column indices.
 */
export class ImporterXlsx implements ImporterInterface {
  /** Logger instance used for logging operations. */
  logger: LoggerInterface

  /**
   * A map storing the loaded worksheets by their sheet names.
   */
  sheets: Map<string, XLSX.WorkSheet> = new Map<string, XLSX.WorkSheet>()

  /**
   * An array of sheet names in the order they appear in the workbook.
   */
  _sheetNames: string[] = [] // eslint-disable-line @typescript-eslint/naming-convention

  /**
   * A converter to map Excel column letters to numbers.
   * The conversion is configured such that the first column corresponds to 0.
   */
  converter: SpreadsheetColumn = new SpreadsheetColumn({ zero: true })

  /**
   * Constructs a new ImporterXlsx instance.
   *
   * @param opts - Options for initializing the importer, including an optional logger.
   */
  constructor(opts: ImporterXlsxOptions = {}) {
    this.logger = opts.logger ?? new LoggerMemory()
  }

  /** The name of the loaded file. */
  filename?: string

  /**
   * Clears all loaded data from the importer to free memory.
   *
   * This method resets the internal sheet names and sheets map.
   */
  clear(): void {
    this._sheetNames = []
    this.sheets = new Map<string, XLSX.WorkSheet>()
  }

  /**
   * Loads an Excel file and stores its worksheets internally.
   *
   * This method reads the specified file using the XLSX library, extracts the sheet names,
   * and populates the internal sheets map with each worksheet.
   *
   * @param fileName - The path or name of the Excel file to load.
   * @returns A promise that resolves when the file has been successfully loaded.
   */
  // eslint-disable-next-line require-await
  async loadFile(fileName: string) {
    this.filename = fileName
    this.sheets = new Map()
    this._sheetNames = []
    const workbook = XLSX.readFile(fileName)

    // Store each sheet in the internal map and record its name.
    workbook.SheetNames.forEach((sheetName) => {
      this._sheetNames.push(sheetName)
      const sheet = workbook.Sheets[sheetName]
      this.sheets.set(sheetName, sheet)
    })
  }

  /**
   * Retrieves the value of a cell from a specified sheet.
   *
   * The cell value is determined by converting the column number (starting at 0) to its Excel column letter,
   * and adjusting the row number (starting at 0) to Excel's 1-based index.
   *
   * @param sheetName - The name of the sheet from which to retrieve the cell value.
   * @param column - The column number (0-based).
   * @param row - The row number (0-based).
   * @returns The cell value as a number, string, or undefined if the cell is empty.
   */
  cellValue(
    sheetName: string,
    column: number,
    row: number
  ): number | string | undefined {
    const sheet = this.sheets.get(sheetName)
    if (sheet !== undefined) {
      const spreadRow: number = row + 1
      const spreadColumn: string = this.converter.fromInt(column)
      const address = `${spreadColumn}${spreadRow}`
      const cell = sheet[address]
      if (cell !== undefined) {
        if (typeof cell.v === 'string') {
          const val = cell.v.trim()
          if (val.length === 0) {
            return undefined
          }
          return val
        }
        return cell.v
      }
    } else {
      throw new Error(
        `The sheet with the name '${sheetName}' could not be found in the file '${this.filename}'`
      )
    }
  }

  /**
   * Retrieves the value of a cell from a specified sheet as a string.
   *
   * If the cell contains a number, it converts it to a string.
   *
   * @param sheetName - The name of the sheet.
   * @param column - The column number (0-based).
   * @param row - The row number (0-based).
   * @returns The cell value as a string, or undefined if the cell is empty.
   */
  cellValueString(
    sheetName: string,
    column: number,
    row: number
  ): string | undefined {
    let value = this.cellValue(sheetName, column, row)
    if (value !== undefined && value !== '') {
      if (typeof value === 'number') {
        value = `${value}`
      }
    }
    return value
  }

  /**
   * Retrieves the sheet names of the loaded workbook in their original order.
   *
   * @returns An array of sheet names.
   */
  get sheetNames(): string[] {
    return this._sheetNames
  }
}
