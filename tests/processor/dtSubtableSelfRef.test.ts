import path from 'node:path'
import { expect, test } from 'vitest'

import { getLoggerMemory } from '../../src/logger/index.js'
import type { InterfaceWriter } from '../../src/processor/index.js'
import type { TestcaseDataInterface } from '../../src/processor/TestcaseDataInterface.js'
import { createOpts } from './Helper.js'

/**
 * A self reference ('ref:::a:') inside a table which is itself pulled in by a
 * reference from another table.
 *
 * MainTable.x references 'ref:1:SubTable::sub1', and SubTable holds
 * 'a = Wert-A' plus 'b = ref:::a:', the self reference.
 *
 * Two defects showed up in this constellation, both invisible from the outside
 * because 'processTable' catches the error and writes it to a logger the test
 * harness does not read (Helper.ts builds its own LoggerMemory instance):
 *
 * 1. 'executeReferenceDirectives' checked that the referenced table exists and
 *    then indexed the instance unchecked, which threw a TypeError. No data was
 *    produced at all.
 * 2. 'Node.buildDirectives' re-pointed every inherited reference directive at
 *    the aggregating node, including self references. The self reference then
 *    resolved against an instance that never receives the field, so 'b' stayed
 *    empty without any error.
 *
 * The plain self reference (same table, no boundary crossed) is already covered
 * by 'dt_easy.xls' / 'Person_self_ref'. Only the crossing is new here.
 */
test('self reference inside a referenced table resolves', async () => {
  const logger = getLoggerMemory()
  logger.clear()
  logger.writeConsole = false

  const datei = path.join(
    import.meta.dirname,
    'fixtures',
    'dt_subtable_selfref.xls'
  )
  const opts = await createOpts(['MainTable', 'SubTable'], [datei])
  const processor = opts.processor

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

  processor.tables = opts.tables
  processor.writer = [writer]

  await processor.processTable(opts.tables.MainTable)

  // Defect 1: without the instance check nothing is produced at all
  expect(geschrieben).toHaveLength(1)

  const daten = geschrieben[0].data
  expect(Object.keys(daten)).toContain('SubTable')

  const subInstanzen = Object.values(daten.SubTable)
  expect(subInstanzen).toHaveLength(1)
  const sub = subInstanzen[0] as Record<string, unknown>

  expect(sub.a).toBe('Wert-A')

  // Defect 2: the self reference must resolve to the value of 'a'
  expect(sub.b).toBe('Wert-A')
})
