import path from 'node:path'
import { expect, test } from 'vitest'

import { DataGeneratorRegistry } from '../../src/data-generator/index.js'
import { createDefaultFileProcessor } from '../../src/processor/defaults.js'
import { getLoggerMemory } from '../../src/logger/index.js'
import type { InterfaceWriter } from '../../src/processor/index.js'
import { TestcaseProcessor } from '../../src/processor/index.js'
import type { TestcaseDataInterface } from '../../src/processor/TestcaseDataInterface.js'
import type { TableInterface } from '../../src/model/index.js'
import { createGeneratorRegistry } from './Helper.js'

/**
 * 'tables' is declared as a REQUIRED option of TestcaseProcessorOptions, so
 * every caller has to pass it. The constructor never read it, though: the
 * property stayed on its '{}' default and only a later 'processor.tables = …'
 * filled it.
 *
 * The type therefore promised something the implementation did not honour, and
 * the failure surfaced far from its cause — references reported
 * "The targetTable 'X' does not exists" for a table that was demonstrably
 * loaded, with no hint that the processor had simply never received it.
 */
test('the constructor honours the tables it requires', async () => {
  const logger = getLoggerMemory()
  logger.clear()
  logger.writeConsole = false

  const fileProcessor = createDefaultFileProcessor(logger)
  await fileProcessor.load([
    path.join(import.meta.dirname, 'fixtures', 'dt_easy.xls')
  ])

  const tables: Record<string, TableInterface> = {}
  for (const table of fileProcessor.tables) {
    tables[table.tableName] = table
  }

  const generatorRegistry: DataGeneratorRegistry = createGeneratorRegistry()

  const geschrieben: TestcaseDataInterface[] = []
  const writer: InterfaceWriter = {
    logger,

    // eslint-disable-next-line require-await
    before: async () => {
      return Promise.resolve()
    },

    // eslint-disable-next-line require-await
    write: async (testcaseData: TestcaseDataInterface) => {
      geschrieben.push(testcaseData)
      return Promise.resolve()
    },

    // eslint-disable-next-line require-await
    after: async () => {
      return Promise.resolve()
    }
  }

  // Tables handed over ONLY through the constructor - no assignment afterwards.
  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry,
    writer: [writer],
    tables
  })

  expect(Object.keys(processor.tables)).toContain('Person_no_ref')

  // And it has to work, not just be stored: 'Person_with_friend' references
  // 'Person_no_ref', which is exactly what an unset table collection breaks.
  await processor.processTable(tables.Person_with_friend)

  expect(geschrieben.length).toBeGreaterThan(0)
  expect(Object.keys(geschrieben[0].data)).toContain('Person_no_ref')
})
