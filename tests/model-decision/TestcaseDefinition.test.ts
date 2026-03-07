import { describe, test, expect } from 'vitest'
import {
  TestcaseDefinitionDecision,
  MultiRowSectionDefinition,
  TestcaseDefinitionDecisionOptions
} from '../../src/model-decision/index.js'

describe('TestcaseDefinitionDecision', () => {
  test('Create instance', () => {
    const obj = new TestcaseDefinitionDecision({
      data: {},
      table: { tableName: 'myTable' }
    } as unknown as TestcaseDefinitionDecisionOptions)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (obj as any).id

    expect(obj !== undefined).toBeTruthy()
    expect(obj).toEqual({
      isPartOfCompletion: true,
      multiplicity: 1,
      data: {},
      meta: undefined,

      execute: true,
      neverExecute: false,
      table: { tableName: 'myTable' }
    })
  })

  test('Create instance with name', () => {
    const obj = new TestcaseDefinitionDecision({
      data: {},
      table: { tableName: 'myTable' },
      tableMeta: {
        tableName: 'myTable'
      },
      testcaseName: 'tc 1'
    } as unknown as TestcaseDefinitionDecisionOptions)

    delete (obj as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
    delete (obj as any).logger // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(obj).toEqual({
      isPartOfCompletion: true,
      multiplicity: 1,
      data: {},
      execute: true,
      neverExecute: false,
      table: { tableName: 'myTable' },
      tableMeta: {
        tableName: 'myTable'
      },
      testcaseName: 'tc 1'
    })
  })

  describe('validate', () => {
    test('Create instance with name', () => {
      const obj = new TestcaseDefinitionDecision({
        name: 'Super testcase',
        data: {},
        table: { tableName: 'myTable' },
        tableMeta: {
          tableName: 'myTable'
        },
        testcaseName: 'tc 1'
      } as unknown as TestcaseDefinitionDecisionOptions)
      const section = new MultiRowSectionDefinition({ name: 'Super section' })
      section.mandatory = false

      const issues = obj.validate(section)
      expect(issues.length === 0).toBeTruthy()
    })

    test('TestcaseDefinitionDecision with missing value', () => {
      const obj = new TestcaseDefinitionDecision({
        name: 'Super testcase',
        table: { tableName: 'myTable' },
        data: {},
        tableMeta: {
          tableName: 'myTable'
        },
        testcaseName: 'Super testcase'
      } as unknown as TestcaseDefinitionDecisionOptions)
      const section = new MultiRowSectionDefinition({ name: 'Super section' })
      section.mandatory = true
      section.createNewRow()
      section.createNewRow()
      section.createNewRow()
      section.mandatory = true

      const issues = obj.validate(section)
      expect(issues.length === 1).toBeTruthy()
      expect(issues[0].message).toEqual(
        `The testcase 'Super testcase' has no value defined for the section 'Super section'`
      )
    })

    test('TestcaseDefinitionDecision with too many values', () => {
      const obj = new TestcaseDefinitionDecision({
        name: 'Super testcase',
        table: { tableName: 'myTable' },
        data: {},
        tableMeta: {
          tableName: 'myTable'
        },
        testcaseName: 'Super testcase'
      } as unknown as TestcaseDefinitionDecisionOptions)
      const section = new MultiRowSectionDefinition({ name: 'Super section' })
      const rowId1 = section.createNewRow()
      section.createNewRow()
      const rowId3 = section.createNewRow()
      section.mandatory = true
      section.multiple = false

      obj.data[rowId1] = 'x'
      obj.data[rowId3] = 'x'

      const issues = obj.validate(section)
      expect(issues.length === 1).toBeTruthy()
      expect(issues[0].message).toEqual(
        `The testcase 'Super testcase' has too many values defined for the section 'Super section'`
      )
    })
  })
})
