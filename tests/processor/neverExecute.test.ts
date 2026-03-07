import path from 'node:path'
import { test, expect } from 'vitest'

import { getLoggerMemory } from '../../src/logger/index.js'
import { createOpts } from './Helper.js'
import type { TestcaseDataInterface } from '../../src/processor/TestcaseDataInterface.js'

/**
 * In this case the reference does not have a field name.
 * So we need to check the complete data of the target table
 */

const expected = {
  CreatePerson_mini: {
    2: {
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1'
        }
      ],
      Multi: [
        {
          comment: 'any comment 1',
          key: 'Yes',
          other: 'any value 1'
        }
      ],
      'first-name': 'gen_func 1',
      'last-name': 'gen_func 3'
    }
  },
  Master: {
    // '1': {
    //   Effect: [
    //     {
    //       comment: 'a comment 1',
    //       key: 'Abort action',
    //       other: 'other effect 1',
    //     },
    //   ],
    //   Multi: [
    //     {
    //       comment: 'any comment 1',
    //       key: 'Yes',
    //       other: 'any value 1',
    //     },
    //   ],
    //   gumbo: 'gen_func 3',
    // },
    // '2': {
    //   Effect: [
    //     {
    //       comment: 'a comment 1',
    //       key: 'Abort action',
    //       other: 'other effect 1',
    //     },
    //   ],
    //   Multi: [
    //     {
    //       comment: 'any comment 1',
    //       key: 'Yes',
    //       other: 'any value 1',
    //     },
    //   ],
    //   gumbo: 'gen_func 4',
    // },
    3: {
      Effect: [
        {
          comment: 'a comment 2',
          key: 'Create new Person record',
          other: 'other effect 2'
        }
      ],
      Multi: [
        {
          comment: 'any comment 1',
          key: 'Yes',
          other: 'any value 1'
        }
      ],
      gumbo: 'gen_func 3'
    }
  }
}

test('NeverExecute', async () => {
  const excelTableNames = ['CreatePerson_mini', 'Master']
  const excelFileName = 'decision_table_neverExecute.xls'

  // Clear the log entries
  const logger = getLoggerMemory()
  logger.clear()
  logger.writeConsole = false

  // Excel file to load
  const fixturesDir = path.join(import.meta.dirname, 'fixtures')
  const dataFileName = path.join(fixturesDir, excelFileName)

  const opts = await createOpts(excelTableNames, [dataFileName])
  const processor = opts.processor

  const result: Record<string, Record<string, string>> = {}

  const writer = {
    logger,

    // eslint-disable-next-line require-await
    before: async () => {
      return Promise.resolve()
    },

    // eslint-disable-next-line require-await
    write: async (testcaseData: TestcaseDataInterface) => {
      if (result[testcaseData.tableName] === undefined) {
        result[testcaseData.tableName] = {}
      }

      for (const instId of Object.keys(
        testcaseData.data[testcaseData.tableName]
      )) {
        const dat = testcaseData.data[testcaseData.tableName][instId]
        result[testcaseData.tableName][testcaseData.name] = dat
      }

      return Promise.resolve()
    },

    // eslint-disable-next-line require-await
    after: async () => {
      return Promise.resolve()
    }
  }

  // get the loaded table models
  processor.tables = opts.tables
  processor.writer = [writer]

  // call the processor
  await processor.process()

  // log all the errors
  logger.entries.error.forEach((error) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(error, null, 2))
  })

  expect(result).toEqual(expected)
})
