import path from 'node:path'

import { getLoggerMemory } from '../logger/index.js'
import type { LoggerInterface } from '../logger/index.js'
import type { ParserInterface } from './parser/ParserInterface.js'
import type { TableInterface } from '../model/index.js'
import type { ImporterInterface } from '../importer-xlsx/index.js'

// The key used to identify the end column and end row
export const TABLE_END_KEY = '<END>'

// The start row defines where the data starts in the sheet.
export const START_ROW = 0

// The start column defines where the data starts in the sheet.
export const START_COLUMN = 0

// This is the default configuration for a sheet
const DEFAULT_SHEET_NAME = '__default__'

// The importer will load only tables wich match the given keys
const DEFAULT_TABLE_TYPE_KEYS: string[] = [
  '<DECISION_TABLE>',
  '<MATRIX_TABLE>',
  '<SPECIFICATION>'
]

export interface FileProcessorOptions {
  /** The logger for this file processor */
  logger?: LoggerInterface

  /**
   * The importer will load only tables wich match the given keys
   * The key value must be in the first cell of the table defined by
   * start_row and start_column
   * The keys are not case sensitive
   */
  tableTypeKeys?: string[]
}

/** Strores the sheet definition by its sheet name */
type SheetDefinition = Record<string, SheetDefinitionEntry>

interface SheetDefinitionEntry {
  startRow: number
  startColumn: number
  endKey: string
}

/**
 * The file processor.
 */
export class FileProcessor {
  /** The logger for this file processor */
  logger: LoggerInterface

  /**  Stores importer for file extensions. So the extension of a file defines which importer is used. */
  importerMap: Map<string, ImporterInterface> = new Map<
    string,
    ImporterInterface
  >()

  /** for every loaded file there may be different type of tables in one Spreadsheet.
   * This map has a parser for the different table types. The processor reads the value
   * in the first cell. This value is the table type. Then the processor looks up
   * if there is a parser registered for this table type.
   */
  parserMap: Map<string, ParserInterface> = new Map<string, ParserInterface>()

  /**
   * Defines the start column and row per sheetName. Also which key is used
   * to find the end of a row or the last column.
   * This map stores the definition per sheet name.
   * The format of ths definition is:
   * \{
   *   startRow: 0,
   *   startColumn: 0,
   *   endKey: '\<END\>',
   * \}
   */
  sheetDefinition: SheetDefinition = {}

  /**
   * The importer will load only tables wich match the given keys
   * The key value must be in the first cell of the table defined by
   * start_row and start_column
   * The keys are not case sensitive
   */
  tableTypeKeys: string[]

  /** Stores the loaded tables by its name */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _tables: Map<string, TableInterface> = new Map<
    string,
    TableInterface
  >()

  constructor(opts: FileProcessorOptions = {}) {
    /** The logger for the processor */
    this.logger = opts.logger || getLoggerMemory()

    this.sheetDefinition[DEFAULT_SHEET_NAME] = {
      startRow: START_ROW,
      startColumn: START_COLUMN,
      endKey: TABLE_END_KEY
    }

    /**
     * The importer will load only tables wich match the given keys
     * The key value must be in the first cell of the table defined by
     * start_row and start_column
     * The keys are not case sensitive
     */
    this.tableTypeKeys = opts.tableTypeKeys
      ? opts.tableTypeKeys
      : DEFAULT_TABLE_TYPE_KEYS
  }

  /**
   * Returns all the laoded table models
   * @returns  A list of tables
   */
  get tables() {
    return Array.from(this._tables.values())
  }

  /**
   * Delets all the loaded tables
   */
  clearTables() {
    this._tables = new Map<string, TableInterface>()
  }

  /**
   * Loads a list of files
   * @param fileNames - The file(s) to open
   */
  async load(fileNames: string | string[]) {
    if (!Array.isArray(fileNames)) {
      fileNames = [fileNames]
    }

    for (const fileName of fileNames) {
      this.logger.debug(`Load the file '${fileName}'`)

      try {
        const importer = this.getImporter(fileName)
        importer.logger = this.logger

        // imports a spreadsheet and returns an array of tables
        await importer.loadFile(fileName)
        this.processImporter(importer, fileName)
      } catch (err) {
        if (typeof err === 'string') {
          this.logger.error({
            function: 'load',
            message: err,
            fileName
          })
        } else if (err instanceof Error) {
          this.logger.error({
            function: 'load',
            stack: err.stack,
            message: err.message,
            fileName
          })
        }
      }
    }
  }

  /**
   * Adds a new table to the loaded tables
   * @param sheetName - The name of the table
   * @param tableModel - The table itself
   */
  private addTable(sheetName: string, tableModel: TableInterface) {
    if (this._tables.has(sheetName)) {
      this.logger.warning(
        `The table '${sheetName}' was already loaded. Now it is overwritten with a new version`
      )
    }
    this._tables.set(sheetName, tableModel)
  }

  /**
   * Processes the sheets imported by the importer.
   * @param importer - The sheet importer
   * @param fileName - The name of the file
   */
  private processImporter(importer: ImporterInterface, fileName: string): void {
    const sheetNames = importer.sheetNames

    for (const sheetName of sheetNames) {
      this.logger.debug(
        `Process the sheet '${sheetName}' of the file '${fileName}'`
      )

      const row = this.getSheetStartRow(sheetName)
      const column = this.getSheetStartColumn(sheetName)
      const endKey = this.getSheetEndKey(sheetName)

      if (typeof row !== 'number') {
        throw new Error(
          JSON.stringify({
            message: `The sheet start row for '${sheetName}' must be a number`,
            function: '_processImporter',
            fileName
          })
        )
      }

      if (typeof column !== 'number') {
        throw new Error(
          JSON.stringify({
            message: `The sheet start column for '${sheetName}' must be a number`,
            function: '_processImporter',
            fileName
          })
        )
      }

      const tableType = importer.cellValueString(sheetName, column, row)
      if (tableType !== undefined) {
        const parser = this.getParser(tableType)
        if (parser !== undefined) {
          parser.startRow = row
          parser.startColumn = column
          parser.endKey = endKey
          parser.logger = this.logger

          // Ok, parse the sheet
          const tableModel = parser.parse({ sheetName, importer, fileName })
          if (tableModel !== undefined) {
            this.addTable(sheetName, tableModel)
          }
        } else {
          this.logger.info(
            `Ignore the sheet '${sheetName}' in file '${fileName}' because there is no parser for the table type '${tableType}'`
          )
        }
      } else {
        this.logger.info(
          `Ignore the sheet '${sheetName}' in file '${fileName}' because it has no table type in the first cell`
        )
      }
    }
  }

  /**
   * Registers an importer for a file extension. The extension are
   * not case sensitive
   * @param extension - The file extension. For Example 'xlsx'
   * @param importer - An instance of an importer
   */
  registerImporter(extension: string, importer: ImporterInterface): void {
    if (this.importerMap.has(extension)) {
      // A step with the same name was already registred
      this.logger.warning(
        `There was already an importer registered with the extension '${extension}'`
      )
    }
    this.importerMap.set(extension.toLowerCase(), importer)
  }

  /**
   * Returns an instance of a step class
   * @param fileName - The name of the file to import
   * @returns The importer for this file or throws an exception
   */
  getImporter(fileName: string): ImporterInterface {
    const ext =
      path.extname(fileName) !== ''
        ? path.extname(fileName).substring(1)
        : undefined
    if (ext !== undefined) {
      const importer = this.importerMap.get(ext.toLowerCase())
      if (importer !== undefined) {
        return importer
      }

      throw new Error(
        JSON.stringify({
          message: `There was no importer registered for the extension '${ext}'`,
          function: 'getImporter',
          fileName
        })
      )
    }

    throw new Error(
      JSON.stringify({
        message: `The file name '${fileName}' does not have an extension. So no importer could be found.`,
        function: 'getImporter',
        fileName
      })
    )
  }

  /**
   * Registers a parser for a table type
   * @param type - The table type
   * @param parser - The parser to use
   */
  registerParser(type: string, parser: ParserInterface): void {
    if (this.importerMap.has(type)) {
      // A step with the same name was already registred
      this.logger.warning(
        `There was already a parser registered with the type '${type}'`
      )
    }
    this.parserMap.set(type.toLowerCase(), parser)
  }

  /**
   * Returns an instance of a step class
   * @param type - type of the table
   * @returns The parser for this table type or undefined
   */
  getParser(type: string): ParserInterface {
    const parser = this.parserMap.get(type.toLowerCase())
    if (parser !== undefined) {
      return parser
    }
    throw new Error(`There is no parser for the table type '${type}'`)
  }

  /**
   * Sets a config for a sheet name. Each sheet may have different configs
   * @param sheetName - The name of the sheet
   * @param config - A config for the sheet.
   */
  setSheetConfig(
    sheetName: string,
    config: SheetDefinitionEntry = {
      startRow: 0,
      startColumn: 0,
      endKey: TABLE_END_KEY
    }
  ): void {
    this.sheetDefinition[sheetName] = config
  }

  /**
   * Returns the startRow for a given sheetName.
   * If there is no definition for the sheetName
   * The default definition will be returned.
   * @param sheetName - Optional: The name of the sheet
   * @returns The row number to start reading
   */
  private getSheetStartRow(sheetName = DEFAULT_SHEET_NAME): number {
    if (this.sheetDefinition[sheetName] === undefined) {
      return this.sheetDefinition[DEFAULT_SHEET_NAME].startRow
    }
    return this.sheetDefinition[sheetName].startRow
  }

  /**
   * Returns the startColumn for a given sheetName.
   * If there is no definition for the sheetName
   * The default definition will be returned.
   * @param sheetName - Optional: The name of the sheet
   * @returns startColumn The column number
   */
  private getSheetStartColumn(sheetName = DEFAULT_SHEET_NAME): number {
    if (this.sheetDefinition[sheetName] === undefined) {
      return this.sheetDefinition[DEFAULT_SHEET_NAME].startColumn
    }
    return this.sheetDefinition[sheetName].startColumn
  }

  /**
   * Returns the endKey for a given sheetName.
   * If there is no definition for the sheetName
   * The default definition will be returned.
   * @param sheetName - Optional: The name of the sheet
   * @returns The endKey for this sheet
   */
  private getSheetEndKey(sheetName = DEFAULT_SHEET_NAME): string {
    if (this.sheetDefinition[sheetName] === undefined) {
      return this.sheetDefinition[DEFAULT_SHEET_NAME].endKey
    }
    return this.sheetDefinition[sheetName].endKey
  }
}
