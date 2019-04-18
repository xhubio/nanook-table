import { getLoggerMemory } from '@xhubiotable/logger'

import { ImporterXlsx } from '@xhubiotable/importer-xlsx'
import {
  FileProcessor,
  ParserMatrix,
  ParserDecision,
  ParserSpecification,
} from '@xhubiotable/file-processor'

import { GeneratorFaker, TDGServiceRegistry } from '@xhubiotable/data-generator'
import GeneratorPostProcess from './generator/GeneratorPostProcess'
import GeneratorMyPerson from './generator/GeneratorMyPerson'
import GeneratorNoData from './generator/GeneratorNoData'
import GeneratorArgs from './generator/GeneratorArgs'

import { Processor } from '@xhubiotable/processor'

const LOGGER = getLoggerMemory()

let fileProcessor

async function createFileProcessor() {
  if (fileProcessor === undefined) {
    const parserMatrix = new ParserMatrix()
    const parserDecision = new ParserDecision()
    const parserSpecification = new ParserSpecification()
    const importer = new ImporterXlsx()

    fileProcessor = new FileProcessor({ logger: LOGGER })
    await fileProcessor.registerImporter('xlsx', importer)
    await fileProcessor.registerImporter('xls', importer)
    await fileProcessor.registerParser('<DECISION_TABLE>', parserDecision)
    await fileProcessor.registerParser('<MATRIX_TABLE>', parserMatrix)
    await fileProcessor.registerParser(
      '<SPECIFICATION_TABLE>',
      parserSpecification
    )
  }

  return fileProcessor
}

/**
 * Create the options to create a processor
 * @param tableNames {array} An array of table names to be included
 * @param fileName {array} An array of spreadsheet files to be loaded
 * @return opts {object} The options object for creating the processor
 */
export async function createOpts(tableNames = [], fileNames = []) {
  const generatorRegistry = createGeneratorRegistry()
  const processor = createProcessor(generatorRegistry)
  const opts = {
    generators: generatorRegistry,
    exporterArray: [],
    tables: {},
    processor,
  }

  fileProcessor = await createFileProcessor()
  fileProcessor.clearTables()
  await fileProcessor.load(fileNames)
  const tables = fileProcessor.tables
  const tableNameSet = new Set(tableNames)

  for (const table of tables) {
    if (tableNameSet.has(table.name)) {
      opts.tables[table.name] = table
    }
  }

  return opts
}

export function createGeneratorRegistry() {
  const serviceRegistry = new TDGServiceRegistry()
  const genFaker = new GeneratorFaker()
  const genMyPerson = new GeneratorMyPerson()
  const genEmpty = new GeneratorNoData()
  const genArgs = new GeneratorArgs()
  const genPostProcess = new GeneratorPostProcess()

  serviceRegistry.registerGenerator('faker', genFaker)
  serviceRegistry.registerGenerator('myPerson', genMyPerson)
  serviceRegistry.registerGenerator('empty', genEmpty)
  serviceRegistry.registerGenerator('args', genArgs)
  serviceRegistry.registerGenerator('postProcess', genPostProcess)

  return serviceRegistry
}

export function createProcessor(generatorRegistry) {
  const processor = new Processor({
    generatorRegistry,
  })

  return processor
}
