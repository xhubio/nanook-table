import { describe, test, expect } from 'vitest'
import path from 'node:path'

import { TableDecision } from '../../src/model-decision/index.js'
import { LoggerMemory } from '../../src/logger/index.js'
import { deserializeTableFromFile } from '../../src/model-decision/deserializer/deserializeTable.js'

const FIXTURES = path.join(import.meta.dirname, 'fixtures', 'TableDecision')
const dataFile = path.join(FIXTURES, 'table_createPerson.json')
const serialzedFile = path.join(FIXTURES, 'demoTable.json')
const dataFileDouble = path.join(FIXTURES, 'doubleEquivalenceName.json')

describe('Table', () => {
  describe('Complete table test', () => {
    test('all', async () => {
      const model = await deserializeTableFromFile(dataFile)
      const issues = model.validate()
      model.calculate()

      // NO errors expected
      expect(issues).toEqual([])
    })
  })

  describe('validate double field name', () => {
    test('all', async () => {
      const model = await deserializeTableFromFile(dataFileDouble)
      const issues = model.validate()

      expect(issues).toEqual([
        {
          level: 'ERROR',
          message:
            "The fieldName 'first-name' is duplicated in the table 'CreatePerson'",
          tableName: 'CreatePerson',
          type: 'tableDecision'
        }
      ])
    })
  })

  describe('Create Instance', () => {
    test('Create instance without name', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'myTable'
      })
      expect(obj !== undefined).toBeTruthy()

      delete (obj as any).singleCheck // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).sectionNames // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(obj).toEqual({
        tableName: 'myTable',
        fileName: 'myFile',
        tableType: 'decision-table',
        testcaseOrder: [],
        testcases: {},
        sections: {},
        sectionOrder: []
      })
    })

    test('Create instance with name', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      expect(obj !== undefined).toBeTruthy()

      delete (obj as any).singleCheck // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).sectionNames // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(obj).toEqual({
        tableName: 'best name',
        fileName: 'myFile',
        tableType: 'decision-table',
        testcaseOrder: [],
        testcases: {},
        sections: {},
        sectionOrder: []
      })
    })
  })

  describe('addNewMultiRowSection', () => {
    test('ERROR: position < 0', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      expect(() => {
        obj.addNewMultiRowSection('singleRowSec', -3)
      }).toThrow()
    })

    test('add row no testcase', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      const sectionDefinition = obj.addNewMultiRowSection('multiRowSec')

      expect(sectionDefinition !== undefined).toBeTruthy()
      expect(sectionDefinition.name).toEqual('multiRowSec')
      expect(sectionDefinition.sectionType).toEqual('MultiRowSection')

      const definitionId = sectionDefinition.headerRow

      expect(obj.sections[definitionId]).toEqual(sectionDefinition)
      delete (obj as any).sections // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).singleCheck // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).sectionNames // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(obj).toEqual({
        tableName: 'best name',
        fileName: 'myFile',
        tableType: 'decision-table',
        testcaseOrder: [],
        testcases: {},
        sectionOrder: [definitionId]
      })
    })
  })

  describe('addNewFieldSection', () => {
    test('ERROR: position < 0', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      expect(() => {
        obj.addNewFieldSection('fieldRowSec', -3)
      }).toThrow()
    })

    test('add section no testcase', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      const sectionDefinition = obj.addNewFieldSection('fieldRowSec')

      expect(sectionDefinition !== undefined).toBeTruthy()
      expect(sectionDefinition.name).toEqual('fieldRowSec')
      expect(sectionDefinition.sectionType).toEqual('FieldSection')

      const definitionId = sectionDefinition.headerRow

      expect(obj.sections[definitionId]).toEqual(sectionDefinition)
      delete (obj as any).sections // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).singleCheck // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).sectionNames // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(obj).toEqual({
        tableName: 'best name',
        fileName: 'myFile',
        tableType: 'decision-table',
        testcaseOrder: [],
        testcases: {},
        sectionOrder: [definitionId]
      })
    })
  })

  describe('addNewSummarySection', () => {
    test('ERROR: position < 0', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      expect(() => {
        obj.addNewSummarySection('Summary', -3)
      }).toThrow()
    })

    test('add section no testcase', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      const sectionDefinition = obj.addNewSummarySection('Summary')

      expect(sectionDefinition !== undefined).toBeTruthy()
      expect(sectionDefinition.name).toEqual('Summary')
      expect(sectionDefinition.sectionType).toEqual('SummarySection')

      const definitionId = sectionDefinition.headerRow

      expect(obj.sections[definitionId]).toEqual(sectionDefinition)
      delete (obj as any).sections // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).singleCheck // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).sectionNames // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (obj as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(obj).toEqual({
        tableName: 'best name',
        fileName: 'myFile',
        tableType: 'decision-table',
        testcaseOrder: [],
        testcases: {},
        sectionOrder: [definitionId]
      })
    })
  })

  describe('addNewTestcase', () => {
    test('Add testcase no sections', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      const tc1 = obj.addNewTestcase('tc1')
      const tc3 = obj.addNewTestcase('tc3')
      const tc2 = obj.addNewTestcase('tc2', 1)

      expect(tc1.testcaseName).toEqual('tc1')

      expect(obj.testcaseOrder.length).toEqual(3)

      const idTc1 = obj.testcaseOrder[0]
      const idTc2 = obj.testcaseOrder[1]
      const idTc3 = obj.testcaseOrder[2]

      expect(idTc1).toEqual(tc1.id)
      expect(idTc2).toEqual(tc2.id)
      expect(idTc3).toEqual(tc3.id)

      expect(obj.testcases[idTc1]).toEqual(tc1)
      expect(obj.testcases[idTc2]).toEqual(tc2)
      expect(obj.testcases[idTc3]).toEqual(tc3)
    })
  })

  describe('validate table', () => {
    test('Table without any data but name', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      const issues = obj.validate()
      expect(issues).toEqual([])
    })
  })

  describe('Add section wich can only exists once', () => {
    test('add double summary section', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      obj.addNewSummarySection('Summary')
      expect(() => {
        obj.addNewSummarySection('Summary2')
      }).toThrow(
        `The section of type 'SummarySection' must not be added multiple times to the model`
      )
    })

    test('add double execute section', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      obj.addNewExecuteSection('Summary')
      expect(() => {
        obj.addNewExecuteSection('Summary2')
      }).toThrow(
        `The section of type 'ExecuteSection' must not be added multiple times to the model`
      )
    })

    test('add double multiplicity section', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      obj.addNewMultiplicitySection('Summary')
      expect(() => {
        obj.addNewMultiplicitySection('Summary2')
      }).toThrow(
        `The section of type 'MultiplicitySection' must not be added multiple times to the model`
      )
    })
  })

  describe('getTestcaseForName', () => {
    test('Add testcase no sections', () => {
      const obj = new TableDecision({
        fileName: 'myFile',
        logger: new LoggerMemory(),
        tableName: 'best name'
      })
      const tc1 = obj.addNewTestcase('tc1')
      const tc3 = obj.addNewTestcase('tc3')
      const tc2 = obj.addNewTestcase('tc2', 1)

      const resTc1 = obj.getTestcaseForName('tc1')
      expect(resTc1).toEqual(tc1)

      const resTc2 = obj.getTestcaseForName('tc2')
      expect(resTc2).toEqual(tc2)

      const resTc3 = obj.getTestcaseForName('tc3')
      expect(resTc3).toEqual(tc3)
    })
  })

  test('getTestcasesForExecution', () => {
    const table = new TableDecision({
      fileName: 'myFile',
      logger: new LoggerMemory(),
      tableName: 'best name'
    })
    const tc1 = table.addNewTestcase('tc1')
    const tc3 = table.addNewTestcase('tc3')
    const tc2 = table.addNewTestcase('tc2', 1)

    delete (tc1 as any).table // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (tc2 as any).table // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (tc3 as any).table // eslint-disable-line @typescript-eslint/no-explicit-any

    delete (tc1 as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (tc2 as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (tc3 as any).id // eslint-disable-line @typescript-eslint/no-explicit-any

    const gen = table.getTestcasesForExecution()

    let genObj = gen.next()
    delete (genObj as any).value.id // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (genObj as any).value.table // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(genObj.value).toEqual(tc1)

    genObj = gen.next()
    delete (genObj as any).value.id // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (genObj as any).value.table // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(genObj.value).toEqual(tc2)

    genObj = gen.next()
    delete (genObj as any).value.id // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (genObj as any).value.table // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(genObj.value).toEqual(tc3)

    genObj = gen.next()
    expect(genObj.done).toBeTruthy()
    expect(genObj.value).toBeUndefined()
  })
})

describe('Example from real decision table', () => {
  test('tc1, should create the directives', async () => {
    const fileName = 'decision_table_data_for_model_decision.xls'

    const table = await deserializeTableFromFile(serialzedFile)
    const tc1 = table.getTestcaseForName('1')
    const directives = tc1.createDirectives()

    expect(directives.generator).toEqual([
      {
        fieldName: 'password',
        testcaseMeta: {
          fileName,
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1'
        },
        generatorName: 'password',
        config: '{"val": "toShort"}',
        instanceIdSuffix: '',
        order: 1000
      }
    ])

    expect(directives.static).toEqual([
      {
        fieldName: 'userId',
        testcaseMeta: {
          fileName,
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1'
        },
        value: '<EMPTY>'
      }
    ])

    expect(directives.reference).toEqual([
      {
        fieldName: 'Password 2',
        testcaseMeta: {
          fileName,
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1'
        },
        targetTableName: 'gumTable',
        targetFieldName: 'field1',
        targetTestcaseName: 'tc3',
        instanceIdSuffix: ''
      }
    ])

    expect(directives.field).toEqual([
      {
        fieldName: 'Result',
        testcaseMeta: {
          fileName,
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1'
        },
        key: 'Error',
        comment: 'Comment 1'
      },
      {
        fieldName: 'Result',
        testcaseMeta: {
          fileName,
          tableName: 'myTable',
          tableType: 'decision-table',
          testcaseName: '1'
        },
        key: 'Error',
        comment: 'Comment 4'
      }
    ])
  })
})
