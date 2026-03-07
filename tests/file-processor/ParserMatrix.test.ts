import path from 'node:path'
import { test, expect } from 'vitest'

import { ImporterXlsx } from '../../src/importer-xlsx/index.js'
import { ParserMatrix } from '../../src/file-processor/parser/ParserMatrix.js'
import { LoggerMemory } from '../../src/logger/index.js'

const fixturesDir = path.join(import.meta.dirname, 'fixtures')
const filename = path.join(fixturesDir, 'matrix/action_on_person.xls')

test('Should return an empty table as column and row meta entries are missing', async () => {
  const logger = new LoggerMemory()
  logger.writeConsole = false

  const importer = new ImporterXlsx()
  await importer.loadFile(filename)
  const parser = new ParserMatrix({ logger })

  const table = parser.parse({
    sheetName: 'Action on Person invalid meta',
    importer,
    fileName: 'myFile'
  })
  expect(table).toBeUndefined()

  const errors = logger.entries.error
  expect(errors).toBeDefined()
})

test('Test action_on_person table: load ', async () => {
  const logger = new LoggerMemory()
  logger.writeConsole = false

  const importer = new ImporterXlsx()
  await importer.loadFile(filename)
  const parser = new ParserMatrix({ logger })
  const table = parser.parse({
    sheetName: 'Action on Person',
    importer,
    fileName: 'myFile'
  })

  expect(table).toMatchObject({
    tableType: 'matrix-table',
    rows: [
      {
        name: 'psn',
        position: 1,
        execute: 'x',
        generator: 'gen::empty',
        description: 'pers desc'
      },
      {
        name: 'myName',
        position: 2,
        generator: 'Person:3'
      }
    ],
    columns: [
      {
        description: undefined,
        execute: 'x',
        generator: 'gen::empty',
        name: 'Keine',
        position: 1,
        shortName: undefined
      },
      {
        description: undefined,
        execute: undefined,
        generator: undefined,
        name: undefined,
        position: undefined,
        shortName: undefined
      },
      {
        description: undefined,
        execute: undefined,
        generator: undefined,
        name: 'add email',
        position: 3,
        shortName: undefined
      },
      {
        description: undefined,
        execute: 'x',
        generator: 'Person:4',
        name: 'delete email',
        position: 4,
        shortName: undefined
      },
      {
        description: undefined,
        execute: 'x',
        generator: undefined,
        name: 'change last name',
        position: 5,
        shortName: undefined
      }
    ],
    data: [
      ['x', undefined, undefined, 'x', 'x'],
      ['x', undefined, 'x', undefined, 'x']
    ],
    tableName: 'Action on Person'
  })
})
