import { LoggerMemory } from '../../src/logger/index.js'

import { ImporterXlsx } from '../../src/importer-xlsx/index.js'
import {
  FileProcessor,
  ParserMatrix,
  ParserDecision,
  ParserSpecification
} from '../../src/file-processor/index.js'

import {
  DataGeneratorRegistry,
  GeneratorFaker
} from '../../src/data-generator/index.js'
import { GeneratorPostProcess } from './generator/GeneratorPostProcess.js'
import { GeneratorMyPerson } from './generator/GeneratorMyPerson.js'
import { GeneratorNoData } from './generator/GeneratorNoData.js'
import { GeneratorArgs } from './generator/GeneratorArgs.js'

import type { InterfaceWriter } from '../../src/processor/index.js'
import { TestcaseProcessor } from '../../src/processor/index.js'
import type { TableInterface } from '../../src/model/index.js'

const LOGGER = new LoggerMemory()

let fileProcessor: FileProcessor

function createFileProcessor() {
  if (fileProcessor === undefined) {
    const parserMatrix = new ParserMatrix({ logger: LOGGER })
    const parserDecision = new ParserDecision({ logger: LOGGER })
    const parserSpecification = new ParserSpecification({ logger: LOGGER })
    const importer = new ImporterXlsx()

    fileProcessor = new FileProcessor({ logger: LOGGER })
    fileProcessor.registerImporter('xlsx', importer)
    fileProcessor.registerImporter('xls', importer)
    fileProcessor.registerParser('<DECISION_TABLE>', parserDecision)
    fileProcessor.registerParser('<MATRIX_TABLE>', parserMatrix)
    fileProcessor.registerParser('<SPECIFICATION_TABLE>', parserSpecification)
  }

  return fileProcessor
}

/**
 * Create the options to create a processor
 * @param tableNames - An array of table names to be included
 * @param fileName - An array of spreadsheet files to be loaded
 * @returns The options object for creating the processor
 */
export async function createOpts(
  tableNames: string[] = [],
  fileNames: string[] = []
) {
  const generatorRegistry = createGeneratorRegistry()

  fileProcessor = createFileProcessor()
  fileProcessor.clearTables()
  await fileProcessor.load(fileNames)
  const tables = fileProcessor.tables
  const tableNameSet = new Set(tableNames)

  const newTables: Record<string, TableInterface> = {}
  for (const table of tables) {
    if (tableNameSet.has(table.tableName)) {
      newTables[table.tableName] = table
    }
  }

  const processor = createProcessor({
    generatorRegistry,
    writer: [],
    tables: newTables
  })
  const opts = {
    generatorRegistry,
    writer: [],
    tables: newTables,
    processor
  }

  return opts
}

export function createGeneratorRegistry() {
  const generatorRegistry = new DataGeneratorRegistry()
  const genFaker = new GeneratorFaker({ generatorRegistry, name: 'faker' })
  const genMyPerson = new GeneratorMyPerson({
    generatorRegistry,
    name: 'myPerson'
  })
  const genEmpty = new GeneratorNoData({ generatorRegistry, name: 'empty' })
  const genArgs = new GeneratorArgs({ generatorRegistry, name: 'args' })
  const genArgs1 = new GeneratorArgs({ generatorRegistry, name: 'gumbo' })
  const genArgs2 = new GeneratorArgs({ generatorRegistry, name: 'bazong' })
  const genPostProcess = new GeneratorPostProcess({
    generatorRegistry,
    name: 'postProcess'
  })

  generatorRegistry.registerGenerator('faker', genFaker)
  generatorRegistry.registerGenerator('myPerson', genMyPerson)
  generatorRegistry.registerGenerator('empty', genEmpty)
  generatorRegistry.registerGenerator('args', genArgs)
  generatorRegistry.registerGenerator('gumbo', genArgs1)
  generatorRegistry.registerGenerator('bazong', genArgs2)
  generatorRegistry.registerGenerator('postProcess', genPostProcess)

  return generatorRegistry
}

export function createProcessor(request: {
  generatorRegistry: DataGeneratorRegistry
  writer: InterfaceWriter[]
  tables: Record<string, TableInterface>
}) {
  const { generatorRegistry, tables, writer } = request
  const processor = new TestcaseProcessor({
    generatorRegistry,
    tables,
    writer
  })

  return processor
}
