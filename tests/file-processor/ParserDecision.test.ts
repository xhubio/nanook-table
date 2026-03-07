import path from 'node:path'
import { test, expect, describe } from 'vitest'

import { ImporterXlsx } from '../../src/importer-xlsx/index.js'
import { ParserDecision } from '../../src/file-processor/parser/ParserDecision.js'
import { getLoggerMemory, LoggerMemory } from '../../src/logger/index.js'
import {
  FieldSectionDefinition,
  TableDecision
} from '../../src/model-decision/index.js'
import type { TableDecisionInterface } from '../../src/model-decision/index.js'

const fixturesDir = path.join(import.meta.dirname, 'fixtures')
const dataFile = path.join(fixturesDir, 'decision/decision_table.xls')
const dataFileDoubleField = path.join(fixturesDir, 'decision/double_field.xlsx')
const dataFileSingleRow = path.join(
  fixturesDir,
  'decision/decision_table_singleRow.xls'
)
const dataFileSingleRowSections = path.join(
  fixturesDir,
  'decision/decision_table_mini_singleRowSection.xls'
)

const dataFileMissingSectionType = path.join(
  fixturesDir,
  'decision',
  'table_missing_section.xlsx'
)

const logger = getLoggerMemory()
logger.clear()
logger.writeConsole = false

describe('Importer Methods Tests', () => {
  const importer = new ParserDecision({ logger: new LoggerMemory() })

  const valuesNum = [
    ['', 1],
    ['dd3', 1],
    ['4', 4],
    ['-3', 1],
    ['  3', 3],
    ['""', 1],
    ['3.45', 3]
  ]
  for (const testValue of valuesNum) {
    test(`getMultiplicityFromValue for '${testValue[0]}'`, () => {
      const res = importer['getMultiplicityFromValue'](testValue[0])
      expect(res).toBe(testValue[1])
    })
  }

  const valuesBool = [
    ['1', true],
    ['t', true],
    ['true', true],
    ['T', true],
    ['JA', true],
    ['OK', true],
    ['Yes', true],
    ['y', true],
    ['', false],
    [undefined, false],
    ['A', false],
    ['F', false],
    ['No', false],
    ['111', false],
    ['2', false],
    [' ', false]
  ]
  for (const testValue of valuesBool) {
    test(`_getBoolean for '${testValue[0]}'`, () => {
      const res = importer['getBoolean'](testValue[0])
      expect(res).toEqual(testValue[1])
    })
  }
})

describe('Import decision table Tests', () => {
  test('Test the table content', async () => {
    // just test some content elements

    logger.clear()

    const importer = new ImporterXlsx()
    await importer.loadFile(dataFile)
    const parser = new ParserDecision({ logger })
    const table = parser.parse({
      sheetName: 'CreatePerson',
      importer,
      fileName: 'myFile'
    }) as TableDecision

    expect(table.tableName).toEqual('CreatePerson')
    expect(table.sectionOrder.length).toBe(7)
    const sectionId0 = table.sectionOrder[0]
    const sectionId1 = table.sectionOrder[1]
    const sectionId2 = table.sectionOrder[2]

    expect(table.sections[sectionId0]).toMatchObject({
      comments: {},
      mandatory: false,
      multiInstancesAllowed: true,
      multiple: true,
      name: 'Execute',
      others: {},
      sectionType: 'MultiRowSection'
    })

    expect(table.sections[sectionId1]).toMatchObject({
      comments: {},
      mandatory: false,
      multiInstancesAllowed: true,
      multiple: true,
      name: 'Group',
      others: {},
      sectionType: 'MultiRowSection'
    })

    const section2 = table.sections[sectionId2] as FieldSectionDefinition
    const se2DataRow1 = section2.dataRows[0]
    const se2HeaderRow = section2.headerRow

    expect(section2).toMatchObject({
      mandatory: true,
      multiInstancesAllowed: true,
      multiple: true,
      name: 'Secondary data',
      sectionType: 'FieldSection',
      tdgMandatory: false
    })

    const subSection = section2.subSections[se2DataRow1]
    expect(subSection.dataRows.length).toBe(2)
    subSection.dataRows = []
    expect(Object.keys(subSection.equivalenceClasses).length).toBe(2)
    subSection.equivalenceClasses = {}
    expect(subSection).toMatchObject({
      comments: {},
      equivalenceClasses: {},
      headerRow: se2DataRow1,
      mandatory: true,
      multiInstancesAllowed: true,
      multiple: true,
      name: 'person',
      parent: se2HeaderRow,
      sectionType: 'FieldSubSection',
      tdgMandatory: false,
      tdgs: {}
    })
  })

  test('Test double field name', async () => {
    logger.clear()

    const importer = new ImporterXlsx()
    await importer.loadFile(dataFileDoubleField)
    const parser = new ParserDecision({ logger })
    parser.parse({ sheetName: 'sheet1', importer, fileName: 'myFile' })

    const logs = logger.entries.error
    logs[0].time = 'my dummy time'
    expect(logs).toEqual([
      {
        level: 'error',
        message: {
          column: 1,
          function: 'handleFieldSection',
          message:
            "Double FieldSubSection name 'friend email' in section 'Primary data' in table 'sheet1'",
          row: 14
        },
        time: 'my dummy time'
      }
    ])
  })
})

test('Import decision table with single row sections', async () => {
  logger.clear()

  const importer = new ImporterXlsx()
  await importer.loadFile(dataFileSingleRow)
  const parser = new ParserDecision({ logger })
  const table = parser.parse({
    sheetName: 'CreatePerson_mini',
    importer,
    fileName: 'myFile'
  }) as TableDecisionInterface

  // update the calculation
  table.calculate()

  expect(logger.entries.error).toEqual([])
  const issues = table.validate()
  expect(issues).toEqual([])
})

test('import single row sections', async () => {
  logger.clear()

  const importer = new ImporterXlsx()
  await importer.loadFile(dataFileSingleRowSections)
  const parser = new ParserDecision({ logger })
  const table = parser.parse({
    sheetName: 'CreatePerson_mini',
    importer,
    fileName: 'myFile'
  }) as TableDecisionInterface

  // update the calculation
  table.calculate()

  expect(logger.entries.error).toEqual([])
})

test('import table with missing section type', async () => {
  logger.clear()

  const importer = new ImporterXlsx()
  await importer.loadFile(dataFileMissingSectionType)
  const parser = new ParserDecision({ logger })

  try {
    parser.parse({
      sheetName: 'table_missing_sectionType',
      importer,
      fileName: 'myFile'
    })
  } catch (e) {
    if (e instanceof Error) {
      expect(e.message).toEqual(
        'Could not parse the sheet beacause of the found errors!'
      )
    }
  }

  for (const err of logger.entries.error) {
    err.time = 'my dummy time'
  }

  expect(logger.entries.error).toEqual([
    {
      level: 'error',
      time: 'my dummy time',
      message: {
        message:
          "If a name is entered in column '0' a sectionType must be probvided in column '1'",
        function: 'getNextSection',
        row: 50,
        column: 0
      }
    },
    {
      level: 'error',
      time: 'my dummy time',
      message: {
        message:
          "If a name is entered in column '0' a sectionType must be probvided in column '1'",
        function: 'getNextSection',
        row: 51,
        column: 0
      }
    }
  ])
})

test('import table with missing subSection type', async () => {
  logger.clear()

  const importer = new ImporterXlsx()
  await importer.loadFile(dataFileMissingSectionType)
  const parser = new ParserDecision({ logger })

  try {
    parser.parse({
      sheetName: 'table_missing_subSectionType',
      importer,
      fileName: 'myFile'
    })
  } catch (e) {
    if (e instanceof Error) {
      expect(e.message).toEqual(
        'Could not parse the sheet beacause of the found errors!'
      )
    }
  }

  for (const err of logger.entries.error) {
    err.time = 'my dummy time'
  }

  expect(logger.entries.error).toEqual([
    {
      time: 'my dummy time',
      level: 'error',
      message: {
        message:
          "If a name is entered in column '0' a sectionType must be probvided in column '1'",
        function: 'getNextSection',
        row: 35,
        column: 0
      }
    }
  ])
})
