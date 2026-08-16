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

/**
 * Ein statischer Wert im `generator`-Feld muss zu einer StaticDirective werden.
 *
 * 🔴 Bis 2026-08-16 tat er das nicht: Die Verzweigung in `doCreateDirectives`
 * behandelte `gen:` und `ref:`, und ein einfacher Wert fiel durch — er wurde
 * verworfen. Der `else`-Zweig, der die StaticDirective baut, lief dagegen nur,
 * wenn `generator` **undefiniert** war, und erzeugte dann eine Direktive mit
 * `undefined` als Wert. Beide Faelle waren vertauscht.
 *
 * Die Doku (`docs/guide/matrix-tables.md`) beschreibt das gewollte Verhalten:
 * *„Otherwise, a StaticDirective is created with the value as-is."*
 *
 * Gefunden beim ersten ernsthaften Einsatz von Matrix-Tabellen: eine
 * Statuswechsel-Matrix erzeugte fuenf Testfaelle mit durchweg leerem `data`.
 */
test('A static generator value becomes a static directive', () => {
  const tc = new TestcaseDefinitionMatrix({
    rowNumber: 0,
    columnNumber: 0,
    data: 'x',
    table: { tableName: 'myTable', fileName: 'myFile.xlsx' },
    tableMeta: {
      fileName: 'myFile.xlsx',
      tableName: 'myTable',
      tableType: TABLE_TYPE_MATRIX_TABLE
    },
    rowMeta: { name: 'status', generator: 'active' } as MetaRowColumn,
    columnMeta: { name: 'action', generator: 'archive' } as MetaRowColumn
  } as TestcaseDefinitionMatrixOptions)

  const directives = tc.createDirectives()

  expect(directives.generator).toHaveLength(0)
  expect(directives.reference).toHaveLength(0)
  expect(directives.static).toHaveLength(2)

  const werte = directives.static.map((d) => ({
    fieldName: d.fieldName,
    value: d.value
  }))
  expect(werte).toEqual([
    { fieldName: 'status', value: 'active' },
    { fieldName: 'action', value: 'archive' }
  ])
})

test('A missing generator creates no directive at all', () => {
  const tc = new TestcaseDefinitionMatrix({
    rowNumber: 0,
    columnNumber: 0,
    data: 'x',
    table: { tableName: 'myTable', fileName: 'myFile.xlsx' },
    tableMeta: {
      fileName: 'myFile.xlsx',
      tableName: 'myTable',
      tableType: TABLE_TYPE_MATRIX_TABLE
    },
    rowMeta: { name: 'status' } as MetaRowColumn,
    columnMeta: { name: 'action' } as MetaRowColumn
  } as TestcaseDefinitionMatrixOptions)

  const directives = tc.createDirectives()

  // Eine Direktive mit dem Wert `undefined` ist keine Angabe, sondern Muell im
  // Datensatz — sie hat vorher genau das erzeugt.
  expect(directives.static).toHaveLength(0)
  expect(directives.generator).toHaveLength(0)
  expect(directives.reference).toHaveLength(0)
})
