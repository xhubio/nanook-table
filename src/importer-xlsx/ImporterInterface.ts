import { LoggerInterface } from '../logger/index.js'

/**
 * Interface for an importer that loads spreadsheet files.
 *
 * An importer is responsible for opening a file, reading its contents,
 * and providing access to the sheet names and cell values.
 */
export interface ImporterInterface {
  /**
   * Logger instance for logging importer operations.
   */
  logger: LoggerInterface

  /**
   * Opens and loads a file.
   *
   * This method loads the specified file (which could be a spreadsheet or any other supported format)
   * and prepares its contents for further processing.
   *
   * @param fileName - The path or name of the file to open.
   * @returns A promise that resolves when the file has been successfully loaded.
   */
  loadFile: (fileName: string) => Promise<void>

  /**
   * A list of all sheet names loaded from the file.
   */
  sheetNames: string[]

  /**
   * Retrieves the value of a cell from a specified sheet.
   *
   * @param sheetName - The name of the sheet.
   * @param columnNumber - The column number, starting at 0.
   * @param rowNumber - The row number, starting at 0.
   * @returns The value of the cell as a number, string, or undefined if the cell is empty.
   */
  cellValue: (
    sheetName: string,
    columnNumber: number,
    rowNumber: number
  ) => number | string | undefined

  /**
   * Retrieves the value of a cell from a specified sheet as a string.
   *
   * @param sheetName - The name of the sheet.
   * @param columnNumber - The column number, starting at 0.
   * @param rowNumber - The row number, starting at 0.
   * @returns The cell value as a string, or undefined if the cell is empty.
   */
  cellValueString: (
    sheetName: string,
    columnNumber: number,
    rowNumber: number
  ) => string | undefined

  /**
   * Clears all loaded data to free up memory.
   *
   * This method deletes any cached or loaded data from the importer.
   */
  clear: () => void
}
