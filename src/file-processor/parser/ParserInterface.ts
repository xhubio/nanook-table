import type { TableInterface } from '../../model/index.js'
import type { LoggerInterface } from '../../logger/index.js'
import type { ImporterInterface } from '../../importer-xlsx/index.js'

export interface ParserParseRequest {
  sheetName: string
  importer: ImporterInterface
  fileName: string
}

/**
 * The interface definition for all the table parser.
 */
export interface ParserInterface {
  /** The row to start reading */
  startRow: number

  /** The column to start reading */
  startColumn: number

  /** A string identifying the last row to read */
  endKey: string

  /** The logger to use */
  logger: LoggerInterface

  /**
   * Parses the sheet with the given name und uses the given importer to access
   * the data.
   * @param request - The parameters as defined in @see ParserParseRequest
   * @returns The created table model
   */
  parse: (request: ParserParseRequest) => TableInterface | undefined
}
