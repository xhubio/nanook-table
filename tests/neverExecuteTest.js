import path from 'path'

import { getLoggerMemory } from '@xhubiotable/logger'
import { createOpts } from './Helper'

/**
 * In this case the reference does not have a field name.
 * So we need to check the complete data of the target table
 */

// eslint-disable-next-line no-unused-vars
const expected = {
  CreatePerson_mini: {
    2: {
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1',
        },
      ],
      Multi: [
        {
          comment: 'any comment 1',
          key: 'Yes',
          other: 'any value 1',
        },
      ],
      'first-name': 'gen_func 1',
      'last-name': 'gen_func 3',
    },
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
          other: 'other effect 2',
        },
      ],
      Multi: [
        {
          comment: 'any comment 1',
          key: 'Yes',
          other: 'any value 1',
        },
      ],
      gumbo: 'gen_func 3',
    },
  },
}

test('NeverExecute', async () => {
  const excelTableNames = ['CreatePerson_mini', 'Master']
  const excelFileName = 'decision_table_neverExecute.xls'

  // Clear the log entries
  const logger = getLoggerMemory()
  logger.clear()
  logger.writeConsole = false

  // Excel file to load
  const fixturesDir = path.join(__dirname, 'fixtures')
  const dataFileName = path.join(fixturesDir, excelFileName)

  const opts = await createOpts(excelTableNames, [dataFileName])
  const processor = opts.processor

  const result = {}

  const writer = {
    before: async () => {
      return Promise.resolve()
    },
    write: async (testcaseData) => {
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
    after: async () => {
      return Promise.resolve()
    },
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
