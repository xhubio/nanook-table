import path from 'node:path'
import { test, expect, beforeAll } from 'vitest'

import { ImporterXlsx } from '../../src/importer-xlsx/index.js'
import type { ImporterInterface } from '../../src/importer-xlsx/index.js'
import { ParserSpecification } from '../../src/file-processor/index.js'
import { getLoggerMemory } from '../../src/logger/index.js'

const fixturesDir = path.join(import.meta.dirname, 'fixtures')
const filename = path.join(fixturesDir, 'specification/specification_table.xls')

const logger = getLoggerMemory()
logger.clear()
logger.writeConsole = false

let errors

let parser: ParserSpecification
let importer: ImporterInterface

beforeAll(async () => {
  importer = new ImporterXlsx()
  await importer.loadFile(filename)
  parser = new ParserSpecification({ logger })
})

test('Specification sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'Specification', importer, fileName: 'myFile' })
  errors = logger.entries.error
  expect(errors.length).toEqual(0)
})

test('Specification_mini sheet', () => {
  logger.clear()
  const model = parser.parseSpecification('Specification_mini', importer)
  expect(model).toEqual(MINI_SPEC)
})

test('missing_severity_section sheet', () => {
  logger.clear()
  parser.parse({
    sheetName: 'missing_severity_section',
    importer,
    fileName: 'myFile'
  })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'checkSheetRows',
        message: `The 'Severity' section could not be found`,
        sheet: 'missing_severity_section'
      }
    }
  ])
})

test('missing_rule_section sheet', () => {
  logger.clear()
  parser.parse({
    sheetName: 'missing_rule_section',
    importer,
    fileName: 'myFile'
  })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'checkSheetRows',
        message: `The 'Rule' section could not be found`,
        sheet: 'missing_rule_section'
      }
    }
  ])
})

test('rule_without_severity sheet', () => {
  logger.clear()

  parser.parse({
    sheetName: 'rule_without_severity',
    importer,
    fileName: 'myFile'
  })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseFields/getSeverity',
        message: `The rule in column '10' has no severity asigned`,
        sheet: 'rule_without_severity'
      }
    }
  ])
})

test('rule_with_more_severity sheet', () => {
  logger.clear()
  parser.parse({
    sheetName: 'rule_with_more_severity',
    importer,
    fileName: 'myFile'
  })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseFields/getSeverity',
        message: `The rule in column '10' has more than one severity asigned`,
        row: 15,
        sheet: 'rule_with_more_severity'
      }
    }
  ])
})

test('unused_severity sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'unused_severity', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        message: `The severity 'Error' is not used`,
        function: 'parseSeverities',
        row: 15,
        sheet: 'unused_severity'
      }
    }
  ])
})

test('double_severity sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'double_severity', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseSeverities',
        message: `The severity 'Warning' is double defined`,
        row: 16,
        sheet: 'double_severity'
      }
    }
  ])
})

test('empty_row_1 sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'empty_row_1', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseFields.getField',
        message: `In the row '8' there is no field name defined`,
        row: 8,
        sheet: 'empty_row_1'
      }
    }
  ])
})

test('empty_row_2 sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'empty_row_2', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseSeverities',
        message: `In the row '15' is no severity name defined`,
        row: 15,
        sheet: 'empty_row_2'
      }
    }
  ])
})

test('empty_row_3 sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'empty_row_3', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(2)
  errors[0].time = 'myDummyTime'
  errors[1].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseRules',
        message: `The short description for the rule 'undefined' is not defined`,
        row: 23,
        sheet: 'empty_row_3'
      }
    },
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseRules',
        message: 'The rule name is not defined',
        row: 23,
        sheet: 'empty_row_3'
      }
    }
  ])
})

test('rule_does_not_exists sheet', () => {
  logger.clear()
  parser.parse({
    sheetName: 'rule_does_not_exists',
    importer,
    fileName: 'myFile'
  })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'checkForUnusedRules',
        message: `The rule '5' does not exists in the rule section`,
        sheet: 'rule_does_not_exists'
      }
    }
  ])
})

test('empty_rule_name sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'empty_rule_name', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)

  errors[0].time = 'myDummyTime'

  expect(errors).toMatchObject([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parse',
        message: `The specification sheet 'empty_rule_name' contains empty rule columns`,
        sheet: 'empty_rule_name'
      }
    }
  ])
})

test('unused_rule_1 sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'unused_rule_1', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'checkForUnusedRules',
        message: `The rule '3' is not used`,
        sheet: 'unused_rule_1'
      }
    }
  ])
})

test('unused_rule_2 sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'unused_rule_2', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'checkForUnusedRules',
        message: `The defined rule '5' in the rule section is not used`,
        sheet: 'unused_rule_2'
      }
    }
  ])
})

test('double_rule sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'double_rule', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseRules',
        message: `The rule '4' is double defined`,
        row: 28,
        sheet: 'double_rule'
      }
    }
  ])
})

test('row_without_rule sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'row_without_rule', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toEqual([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parseFields.getField',
        message: `No rules defined for the field 'email' or the rules are not complete.`,
        row: 4,
        sheet: 'row_without_rule'
      }
    }
  ])
})

test('no_end_row sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'no_end_row', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'

  expect(errors).toMatchObject([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parse',
        message: `SheetEndRow: Could not find the end sheet identifier '<END>' in the sheet 'no_end_row' in column '0'`,
        sheet: 'no_end_row'
      }
    }
  ])
})

test('no_rule sheet', () => {
  logger.clear()
  parser.parse({ sheetName: 'no_rule', importer, fileName: 'myFile' })
  errors = logger.entries.error

  expect(errors.length).toEqual(1)
  errors[0].time = 'myDummyTime'
  expect(errors).toMatchObject([
    {
      time: 'myDummyTime',
      level: 'error',
      message: {
        function: 'parse',
        message: `The specification sheet 'no_rule' does not contain any rule`,
        sheet: 'no_rule'
      }
    }
  ])
})

const MINI_SPEC = {
  fieldOrder: ['first-name', 'last-name'],
  fields: {
    'first-name': {
      fieldNameInternal: 'first-name',
      name: 'first-name',
      rules: [
        {
          ruleName: 'PK',
          severity: 'Abort',
          value: 'x'
        },
        {
          ruleName: 'Type',
          severity: 'Warning',
          value: 'String'
        },
        {
          ruleName: 'C1',
          severity: 'Abort',
          value: 'x'
        }
      ]
    },
    'last-name': {
      fieldNameInternal: 'last-name',
      name: 'last-name',
      rules: [
        {
          ruleName: 'PK',
          severity: 'Abort',
          value: 'x'
        },
        {
          ruleName: 'Type',
          severity: 'Warning',
          value: 'String'
        },
        {
          ruleName: 'C1',
          severity: 'Abort',
          value: 'x'
        }
      ]
    }
  },
  name: 'Specification_mini',
  rules: {
    C1: {
      longDesc: 'This is a mandatory field. It must be provided',
      ruleName: 'C1',
      shortDesc: 'mandatory'
    },
    PK: {
      longDesc:
        'This field is part of the object identiy. This is not a kind of primary key like it is used in a database',
      ruleName: 'PK',
      shortDesc: 'Primary key'
    },
    Type: {
      longDesc:
        'The type of this field. {String, Integer, Float, Date, Boolean)',
      ruleName: 'Type',
      shortDesc: 'Field Type'
    }
  },
  severities: ['Abort', 'Warning']
}
