/**
 * This test tests the decision table model.
 * The test is located in the processor because we need to load an excel file
 * for this test.
 */

import path from 'path'
import { ImporterXlsx } from '@xhubiotable/importer-xlsx'
import { ParserDecision, FileProcessor } from '@xhubiotable/file-processor'
import { getLoggerMemory } from '@xhubiotable/logger'

const FIXTURES = path.join(__dirname, 'fixtures')

const dataFile = path.join(
  FIXTURES,
  'decision_table_data_for_model_decision.xls'
)

const logger = getLoggerMemory()
logger.clear()
logger.writeConsole = false

test('createTodos', async (done) => {
  const importer = new ImporterXlsx()
  const parser = new ParserDecision({ logger })

  const fileProcessor = new FileProcessor({ logger })
  await fileProcessor.registerImporter('xlsx', importer)
  await fileProcessor.registerImporter('xls', importer)
  await fileProcessor.registerParser('<DECISION_TABLE>', parser)
  await fileProcessor.registerParser('<MATRIX_TABLE>', parser)
  await fileProcessor.load([dataFile])

  const tables = fileProcessor.tables
  const table = tables[0]

  // update the calculation
  table.calculate()

  const tc1 = table.getTestcaseForName('1')

  const todos = tc1.createTodos()
  expect(todos).toEqual({
    generator: [
      {
        config: '{"val": "toShort"}',
        fieldName: 'password',
        generatorName: 'password',
        instanceIdSuffix: '',
        meta: { comment: undefined, equivalenceClass: 'too short' },
        order: 1000,
        tableName: 'myTable',
        tableType: 'decision-table',
        testcaseMeta: {
          meta: undefined,
          tableMeta: {
            fileName: path.join(
              FIXTURES,
              'decision_table_data_for_model_decision.xls'
            ),
          },
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1',
        },
        testcaseName: '1',
      },
    ],
    meta: [
      {
        fieldName: 'Result',
        meta: { comment: 'Comment 1', key: 'Error', other: undefined },
        tableName: 'myTable',
        tableType: 'decision-table',
        testcaseMeta: {
          meta: undefined,
          tableMeta: {
            fileName: path.join(
              FIXTURES,
              'decision_table_data_for_model_decision.xls'
            ),
          },
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1',
        },
        testcaseName: '1',
      },
      {
        fieldName: 'Result',
        meta: { comment: 'Comment 4', key: 'Error', other: undefined },
        tableName: 'myTable',
        tableType: 'decision-table',
        testcaseMeta: {
          meta: undefined,
          tableMeta: {
            fileName: path.join(
              FIXTURES,
              'decision_table_data_for_model_decision.xls'
            ),
          },
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1',
        },
        testcaseName: '1',
      },
    ],
    reference: [
      {
        fieldName: 'Password 2',
        instanceIdSuffix: '',
        meta: { comment: undefined, equivalenceClass: 'too long' },
        tableName: 'myTable',
        tableType: 'decision-table',
        targetFieldName: 'field1',
        targetTableName: 'gumTable',
        targetTestcaseName: 'tc3',
        testcaseMeta: {
          meta: undefined,
          tableMeta: {
            fileName: path.join(
              FIXTURES,
              'decision_table_data_for_model_decision.xls'
            ),
          },
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1',
        },
        testcaseName: '1',
      },
    ],
    static: [
      {
        fieldName: 'userId',
        meta: { comment: undefined, equivalenceClass: 'empty' },
        tableName: 'myTable',
        tableType: 'decision-table',
        testcaseMeta: {
          meta: undefined,
          tableMeta: {
            fileName: path.join(
              FIXTURES,
              'decision_table_data_for_model_decision.xls'
            ),
          },
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1',
        },
        testcaseName: '1',
        value: '<EMPTY>',
      },
    ],
  })

  done()
})
