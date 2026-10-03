/**
 * Creates defaults for fileProcessor, writer and generator registry.
 * These defaults are not usefull for production, but for starting and testing.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import {
  DataGeneratorRegistry,
  GeneratorFaker
} from '../data-generator/index.js'
import type { InterfaceWriter } from './InterfaceWriter.js'
import {
  FileProcessor,
  ParserMatrix,
  ParserDecision,
  ParserSpecification
} from '../file-processor/index.js'

import { ImporterXlsx } from '../importer-xlsx/index.js'
import { getLoggerMemory } from '../logger/index.js'
import type { LoggerInterface } from '../logger/index.js'
import type { TestcaseDataInterface } from './TestcaseDataInterface.js'

/**
 * Creates a generator registry with 'faker' registered, so that cells like
 * 'gen::faker:person.firstName' work. Register further generators on it; one
 * registered as 'faker' replaces the built-in one.
 * @param logger - The logger for the faker generator (default: the shared LoggerMemory)
 * @returns The registry
 */
export function createDefaultGeneratorRegistry(
  logger: LoggerInterface = getLoggerMemory()
) {
  const generatorRegistry = new DataGeneratorRegistry()
  generatorRegistry.registerGenerator(
    'faker',
    new GeneratorFaker({ generatorRegistry, name: 'faker', logger })
  )
  return generatorRegistry
}

/**
 * Creates the default writer: one JSON file per test case, written as
 * testcaseData.json into a folder named after the test case inside 'dir'.
 * @param logger - The logger
 * @param dir - The directory to write into (default: 'tdg')
 * @returns An array with the writer, as TestcaseProcessor expects it
 */
export function createDefaultWriter(logger: LoggerInterface, dir = 'tdg') {
  return [new DefaultWriter({ logger, dir })]
}

export function createDefaultFileProcessor(logger: LoggerInterface) {
  const importer = new ImporterXlsx()
  const parserMatrix = new ParserMatrix({ logger })
  const parserDecision = new ParserDecision({ logger })
  const parserSpecification = new ParserSpecification({ logger })

  const fileProcessor = new FileProcessor({ logger })

  fileProcessor.registerImporter('xlsx', importer)
  fileProcessor.registerImporter('xls', importer)

  fileProcessor.registerParser('<DECISION_TABLE>', parserDecision)
  fileProcessor.registerParser('<MATRIX_TABLE>', parserMatrix)
  // '<SPECIFICATION>' is the documented marker (guide + DEFAULT_TABLE_TYPE_KEYS).
  // The factory historically registered only '<SPECIFICATION_TABLE>' — a sheet
  // using the documented marker was silently ignored. Both keys stay valid so
  // existing workbooks keep loading.
  fileProcessor.registerParser('<SPECIFICATION>', parserSpecification)
  fileProcessor.registerParser('<SPECIFICATION_TABLE>', parserSpecification)

  return fileProcessor
}

class DefaultWriter implements InterfaceWriter {
  logger: LoggerInterface

  /** The directory the test cases are written into */
  dir: string

  constructor(opts: { logger: LoggerInterface; dir: string }) {
    this.logger = opts.logger
    this.dir = opts.dir
  }

  /**
   * Creates the target directory
   */
  async before(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true })
  }

  after(): Promise<void> {
    return Promise.resolve()
  }

  /**
   * Writes the data
   */
  async write(testcaseData: TestcaseDataInterface): Promise<void> {
    const fileName = this.createFileName(testcaseData)
    await fs.mkdir(path.dirname(fileName), { recursive: true })
    await fs.writeFile(fileName, JSON.stringify(testcaseData, null, 2))
  }

  /**
   * Creates the file name to write the testcaseData object
   * @param testcaseData - The testcaseData object
   * @returns The file name to write the object
   */
  createFileName(testcaseData: TestcaseDataInterface): string {
    const tcName = testcaseData.name
    const targetDir = path.join(this.dir, tcName)
    return path.join(targetDir, 'testcaseData.json')
  }
}
