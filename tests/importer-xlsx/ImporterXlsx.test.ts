import path from 'node:path'
import { test, expect, beforeAll } from 'vitest'

import { ImporterXlsx } from '../../src/importer-xlsx/index.js'

const FILE_NAME = path.join(import.meta.dirname, 'fixtures/descision_table_mini.xlsx')
const SHEET_NAME_COLUMN = 'manyColumns'
const SHEET_NAME_ROW = 'manyRows'
const SHEET_NAME_PERSON = 'Person_with_friend'

const spreadSheet = new ImporterXlsx()

beforeAll(async () => {
  await spreadSheet.loadFile(FILE_NAME)
})

test('test loaded sheets', () => {
  expect(spreadSheet.sheetNames).toEqual([
    SHEET_NAME_COLUMN,
    SHEET_NAME_ROW,
    SHEET_NAME_PERSON
  ])
})

test('get first cell', () => {
  expect(spreadSheet.cellValue(SHEET_NAME_COLUMN, 0, 0)).toEqual(
    '<DECISION_TABLE>'
  )
})

test('get last cell', () => {
  expect(spreadSheet.cellValue(SHEET_NAME_COLUMN, 1022, 0)).toEqual(1018)
})

test('get last row 1', () => {
  expect(spreadSheet.cellValue(SHEET_NAME_COLUMN, 0, 16)).toEqual('<END>')
})

test('get last row 2', () => {
  expect(spreadSheet.cellValue(SHEET_NAME_ROW, 2, 1388)).toEqual('Row 1389')
})

test('Empty filed must be undefined', () => {
  const val = spreadSheet.cellValue(SHEET_NAME_PERSON, 5, 8)
  const valStr = spreadSheet.cellValueString(SHEET_NAME_PERSON, 5, 8)

  expect(val).toBeUndefined()
  expect(valStr).toBeUndefined()
})
