import { test, expect } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { getLoggerMemory, LoggerMemory } from '../../src/logger/index.js'
import { GeneratorFaker } from '../../src/data-generator/index.js'
import type { TableInterface } from '../../src/model/index.js'

import {
  createDefaultGeneratorRegistry,
  createDefaultWriter,
  createDefaultFileProcessor,
  TestcaseProcessor
} from '../../src/processor/index.js'

const logger = getLoggerMemory()

test('createDefaultGeneratorRegistry', () => {
  const registry = createDefaultGeneratorRegistry()
  expect(registry).toBeDefined()
})

test('createDefaultGeneratorRegistry registers faker', () => {
  const registry = createDefaultGeneratorRegistry(logger)
  const faker = registry.getGenerator('faker')
  expect(faker).toBeInstanceOf(GeneratorFaker)
  expect(faker.name).toBe('faker')
})

test('a second registration of faker replaces the built-in one', () => {
  const registry = createDefaultGeneratorRegistry(logger)
  const own = new GeneratorFaker({
    generatorRegistry: registry,
    name: 'faker',
    logger
  })

  // scripts written for 3.2 and earlier register faker themselves,
  // sometimes more than once; the last registration wins
  registry.registerGenerator(
    'faker',
    new GeneratorFaker({ generatorRegistry: registry, name: 'faker', logger })
  )
  registry.registerGenerator('faker', own)

  expect(registry.getGenerator('faker')).toBe(own)
})

test('process() runs with the default registry and writer', async () => {
  const runLogger = new LoggerMemory()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nanook-default-writer-'))
  const fileProcessor = createDefaultFileProcessor(runLogger)
  await fileProcessor.load([
    path.join(import.meta.dirname, 'fixtures', 'dt_multiplicity.xls')
  ])
  const tables: Record<string, TableInterface> = {}
  for (const table of fileProcessor.tables) tables[table.tableName] = table

  const processor = new TestcaseProcessor({
    logger: runLogger,
    generatorRegistry: createDefaultGeneratorRegistry(runLogger),
    writer: createDefaultWriter(runLogger, path.join(dir, 'tdg')),
    tables
  })
  await processor.process()

  expect(runLogger.entries.error).toEqual([])
  // columns 1 and 4, column 2 three times (Multiplicity 3)
  const written = await fs.readdir(path.join(dir, 'tdg'))
  expect(written).toHaveLength(5)
  const first = JSON.parse(
    await fs.readFile(
      path.join(dir, 'tdg', written[0], 'testcaseData.json'),
      'utf8'
    )
  )
  expect(first.tableName).toBe('multiplicity')
  await fs.rm(dir, { recursive: true, force: true })
})

test('createDefaultWriter', () => {
  const writer = createDefaultWriter(logger)
  expect(writer).toBeDefined()
  expect(writer.length).toBe(1)
  expect(writer[0]).toBeDefined()
})

test('createDefaultFileProcessor', () => {
  const fileProcessor = createDefaultFileProcessor(logger)
  expect(fileProcessor).toBeDefined()
})

test('createDefaultFileProcessor registers a parser for every documented A1 marker', () => {
  const fileProcessor = createDefaultFileProcessor(logger)

  // The markers the guide documents. '<SPECIFICATION>' was silently ignored
  // before: the factory only knew '<SPECIFICATION_TABLE>', so a sheet using
  // the documented marker produced no table and no error — only an info log.
  for (const marker of [
    '<DECISION_TABLE>',
    '<MATRIX_TABLE>',
    '<SPECIFICATION>'
  ]) {
    expect(fileProcessor.getParser(marker), marker).toBeDefined()
  }

  // Legacy alias — existing workbooks keep loading.
  expect(fileProcessor.getParser('<SPECIFICATION_TABLE>')).toBeDefined()
})
