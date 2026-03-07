import { test, expect } from 'vitest'
import {
  TABLE_TYPE_MATRIX_TABLE,
  TestcaseDefinitionMatrix,
  TestcaseDefinitionMatrixOptions
} from '../../src/model-matrix/index.js'
import type { MetaRowColumn } from '../../src/model-matrix/index.js'

test('Test create Object', () => {
  const tc = new TestcaseDefinitionMatrix({} as TestcaseDefinitionMatrix)
  expect(tc).not.toBeNull()
})

test('Empty testcase is not executeable', () => {
  const tc = new TestcaseDefinitionMatrix({} as TestcaseDefinitionMatrix)
  expect(tc.execute).toBeFalsy()
})

test('TestcaseDefinitionMatrix creation with opts', () => {
  const tc = new TestcaseDefinitionMatrix({
    rowNumber: 1,
    columnNumber: 2,
    data: '',
    table: { tableName: 'myTable', fileName: 'myFile.xlsx' },
    tableMeta: {
      fileName: 'myFile.xlsx',
      tableName: 'myTable',
      tableType: TABLE_TYPE_MATRIX_TABLE
    },
    rowMeta: { name: 'rowMeta' } as MetaRowColumn,
    columnMeta: { name: 'colMeta' } as MetaRowColumn
  } as TestcaseDefinitionMatrixOptions)

  expect(tc.execute).toBeFalsy()
  delete (tc as unknown as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
  delete (tc as unknown as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any
  expect(tc).toEqual({
    columnNumber: 2,
    data: '',
    columnMeta: {
      name: 'colMeta'
    },
    rowMeta: {
      name: 'rowMeta'
    },
    tableMeta: {
      fileName: 'myFile.xlsx',
      tableName: 'myTable',
      tableType: 'matrix-table'
    },
    multiplicity: 1,
    neverExecute: false,
    rowNumber: 1,
    table: {
      fileName: 'myFile.xlsx',
      tableName: 'myTable'
    }
  })
})
