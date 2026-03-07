import path from 'node:path'
import { test, expect } from 'vitest'

import { getLoggerMemory } from '../../src/logger/index.js'
import { createOpts } from './Helper.js'
import type { InterfaceWriter } from '../../src/processor/index.js'
import { SimpleArrayFilterProcessor } from '../../src/processor/index.js'
import type { TestcaseDataInterface } from '../../src/processor/TestcaseDataInterface.js'
import type { Validator } from './Validator.js'

const filterProcessor = new SimpleArrayFilterProcessor()

interface ExecuteTestRequest {
  excelFileName: string
  excelTableNames: string[]
  validator: Validator
  tableName: string
}

/**
 * Executes the test for the testcase processor of decision tables
 * @param request - The parameters as defined in @see ExecuteTestRequest
 */
export function executeTest(request: ExecuteTestRequest) {
  const { excelFileName, excelTableNames, validator, tableName } = request

  // Clear the log entries
  const logger = getLoggerMemory()
  logger.clear()
  logger.writeConsole = false

  // Excel file to load
  const fixturesDir = path.join(import.meta.dirname, 'fixtures')
  const dataFileName = path.join(fixturesDir, excelFileName)

  // prepare the test name
  const tableNames = excelTableNames.join(', ')
  const testName = `DECISION: Test generated data for table '${excelFileName}' tables: ${tableNames}`
  test(testName, async () => {
    // Create the testcase processor with all the data needed

    const opts = await createOpts(excelTableNames, [dataFileName])
    const processor = opts.processor
    processor.addFilterProcessor(filterProcessor)

    const result: Record<string, Record<string, TestcaseDataInterface>> = {}

    const writer: InterfaceWriter = {
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
        result[testcaseData.tableName][testcaseData.name] = testcaseData
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

    // get the entry table
    const table = opts.tables[tableName]

    // call the processor
    try {
      await processor.processTable(table)
    } catch (error) {
      console.log(error) // eslint-disable-line no-console
      expect(error).toBeUndefined()
    }

    // log all the errors
    logger.entries.error.forEach((error) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(error, null, 2))
    })

    // console.log(JSON.stringify(result, null, 2))
    validator.validate(result)
  })
}
