import { test, expect } from 'vitest'
import { TableMatrix, TableMatrixOptions } from '../../src/model-matrix/index.js'

test('Test create Object', () => {
  const table = new TableMatrix({} as TableMatrixOptions)
  expect(table).not.toBeNull()
})

test('Test getTestcaseForName with wrong name format', () => {
  const table = new TableMatrix(MODEL)
  expect(() => {
    table.getTestcaseForName('hugo')
  }).toThrow(
    `The testcase name 'hugo' is not valid. The name must have the format: 'r<row>:c<column>'`
  )
})

test('Test getTestcaseForName out of range', () => {
  const table = new TableMatrix(MODEL)
  expect(() => {
    table.getTestcaseForName('r10:c2')
  }).toThrow(`The testcase name 'r10:c2' is out of range`)
})

test('Test getTestcaseForName', () => {
  const table = new TableMatrix(MODEL)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tc = table.getTestcaseForName('r1:c2') as unknown as any
  delete tc.id
  tc.table = {
    tableName: MODEL.tableName
  }
  delete tc.logger
  expect(tc).toEqual({
    neverExecute: false,
    columnNumber: 2,
    data: 'x',
    tableMeta: {
      fileName: MODEL.fileName,
      tableName: 'Action on Person',
      tableType: 'matrix-table'
    },
    columnMeta: { name: 'add email', position: 3 },
    rowMeta: {
      generator: 'Person:3',
      name: 'Person without email',
      position: 2
    },
    rowNumber: 1,
    multiplicity: 1,
    table: {
      tableName: MODEL.tableName
    }
  })
})

test('Test getTestcasesForExecution', () => {
  const table = new TableMatrix(MODEL)

  const gen = table.getTestcasesForExecution()

  /**
   * create the expected data
   */
  function createExpected(rowNumber: number, columnNumber: number) {
    return {
      neverExecute: false,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: MODEL.data![rowNumber][columnNumber],
      rowNumber,
      columnNumber,
      tableMeta: {
        fileName: MODEL.fileName,

        tableName: 'Action on Person',
        tableType: 'matrix-table'
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rowMeta: MODEL.rows![rowNumber],
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      columnMeta: MODEL.columns![columnNumber],
      multiplicity: 1,
      table: {
        tableName: MODEL.tableName
      }
    }
  }

  const tableName = MODEL.tableName

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let genObj = gen.next() as unknown as any
  delete genObj.value.id
  delete genObj.value.logger
  genObj.value.table = { tableName }
  expect(genObj.value).toEqual(createExpected(0, 0))

  genObj = gen.next()
  delete genObj.value.id
  delete genObj.value.logger
  genObj.value.table = { tableName }
  expect(genObj.value).toEqual(createExpected(0, 3))

  genObj = gen.next()
  delete genObj.value.id
  delete genObj.value.logger
  genObj.value.table = { tableName }
  expect(genObj.value).toEqual(createExpected(0, 4))

  genObj = gen.next()
  delete genObj.value.id
  delete genObj.value.logger
  genObj.value.table = { tableName }
  expect(genObj.value).toEqual(createExpected(1, 0))

  genObj = gen.next()
  delete genObj.value.id
  delete genObj.value.logger
  genObj.value.table = { tableName }
  expect(genObj.value).toEqual(createExpected(1, 4))

  genObj = gen.next()
  expect(genObj.done).toBeTruthy()
  expect(genObj.value).toBeUndefined()
})

const MODEL = {
  fileName: 'myFile.x',
  tableName: 'Action on Person',

  rows: [
    {
      name: 'Person',
      shortName: 'psn',
      position: 1,
      execute: 'x',
      // reference: 'Person:5',
      generator: 'gen::empty',
      description: 'pers desc'
    },
    {
      name: 'Person without email',
      position: 2,
      generator: 'Person:3'
    }
  ],
  columns: [
    {
      name: 'KEINE',
      position: 1,
      execute: 'x',
      generator: 'gen::empty'
    },
    {},
    {
      name: 'add email',
      position: 3
    },
    {
      name: 'delete email',
      position: 4,
      execute: 'x',
      generator: 'Person:4'
    },
    {
      name: 'change last name',
      position: 5,
      execute: 'x'
    }
  ],
  data: [
    ['x', undefined, undefined, 'x', 'x'],
    ['x', undefined, 'x', undefined, 'x']
  ]
} as unknown as TableMatrixOptions
