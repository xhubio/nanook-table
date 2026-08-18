import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, expect, test } from 'vitest'
import XLSX from 'xlsx'

import { createDefaultFileProcessor } from '../../src/processor/defaults.js'
import { getLoggerMemory } from '../../src/logger/index.js'
import type { InterfaceWriter } from '../../src/processor/index.js'
import { TestcaseProcessor } from '../../src/processor/index.js'
import type { TestcaseDataInterface } from '../../src/processor/TestcaseDataInterface.js'
import type { TableInterface } from '../../src/model/index.js'
import { createGeneratorRegistry } from './Helper.js'

/**
 * What happens when a reference points at a table that does not exist?
 *
 * The answer is not obvious, and the surprising part is not the one people expect.
 * Neither `load()` nor `processTable()` throws — that is a defensible design choice
 * for a batch tool. The trap is the third fact:
 *
 *   1. `load()` reports nothing (references are resolved at generation time)
 *   2. `processTable()` writes ONE error to the logger and returns normally
 *   3. **the testcase is emitted anyway**, complete-looking, minus whatever the
 *      reference was supposed to contribute
 *
 * A consumer that counts the emitted testcases sees the expected number and has no
 * indication that some of them are missing data. Half a run looks exactly like a
 * whole one.
 *
 * This test pins all three so the behaviour cannot change silently. If a future
 * version decides to throw instead, this test is where that decision becomes visible
 * — and it is a breaking change for every consumer that relies on best-effort
 * generation.
 *
 * The contract this documents: **the logger is not optional**. `TestcaseProcessor`
 * defaults to a fresh `LoggerMemory()` that the caller never sees; a consumer must
 * pass its own and inspect `logger.entries.error` after `processTable()`. Anything
 * else discards the only signal there is.
 */

const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nanook-dangling-'))
afterAll(() => fs.rmSync(TEMP, { recursive: true, force: true }))

/** A minimal decision table whose only reference points nowhere. */
const buildWorkbook = (): string => {
  const rows = [
    ['<DECISION_TABLE>', '', '', '', '', 'OK_1'],
    ['Execute', 'ExecuteSection', '', '', '', 'T'],
    ['Multiplicity', 'MultiplicitySection', '', '', '', '1'],
    ['Secondary', 'FieldSection', '', '', '', ''],
    ['session', 'FieldSubSection', '', '', '', ''],
    ['', '', 'refers to', 'ref:1:NoSuchTable:email:owner', '', 'x'],
    ['Primary', 'FieldSection', '', '', '', ''],
    ['field', 'FieldSubSection', '', '', '', ''],
    ['', '', 'value', 'hello', '', 'x'],
    ['Expected reaction', 'MultiRowSection', '', '', '', ''],
    ['', '', 'accepted', '', '', 'x'],
    ['<END>', '', '', '', '', '']
  ]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Probe')
  const file = path.join(TEMP, 'dangling.xlsx')
  XLSX.writeFile(workbook, file)
  return file
}

test('a dangling reference is logged, does not throw, and still emits the testcase', async () => {
  const logger = getLoggerMemory()
  logger.clear()
  logger.writeConsole = false

  const fileProcessor = createDefaultFileProcessor(logger)
  await fileProcessor.load([buildWorkbook()])

  // 1. Loading says nothing at all — references are not resolved yet.
  expect(logger.entries.error ?? []).toHaveLength(0)
  expect(fileProcessor.tables).toHaveLength(1)

  const tables: Record<string, TableInterface> = {}
  for (const table of fileProcessor.tables) {
    tables[table.tableName] = table
  }

  const written: TestcaseDataInterface[] = []
  const writer: InterfaceWriter = {
    logger,
    // eslint-disable-next-line require-await
    before: async () => Promise.resolve(),
    // eslint-disable-next-line require-await
    write: async (testcaseData: TestcaseDataInterface) => {
      written.push(testcaseData)
      return Promise.resolve()
    },
    // eslint-disable-next-line require-await
    after: async () => Promise.resolve()
  }

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry: createGeneratorRegistry(),
    writer: [writer],
    tables
  })

  // 2. Generation does not throw.
  await expect(processor.processTable(tables.Probe)).resolves.not.toThrow()

  // The error exists, and it names the missing table.
  const errors = logger.entries.error ?? []
  expect(errors).toHaveLength(1)
  expect(JSON.stringify(errors[0].message)).toContain('NoSuchTable')

  // 3. THE TRAP: the testcase is emitted regardless. A caller counting results
  //    gets the number it expected and no hint that data is missing.
  expect(written).toHaveLength(1)
  const emitted = JSON.stringify(written[0].data)
  expect(emitted).toContain('hello')
  expect(emitted).not.toContain('owner')
})
