import { test, expect } from 'vitest'
import { FieldDirective } from '../../../src/model/index.js'

test('Should create an instance of the FieldDirective', () => {
  const directive = new FieldDirective({
    fieldName: 'myField',
    testcaseMeta: {
      fileName: 'myFile',
      tableName: 'myTable',
      tableType: 'myTableType',
      testcaseName: 'myTestcaseName'
    },
    comment: 'myComment',
    key: 'myKey',
    other: 'myOther'
  })
  expect(directive).toBeDefined()
})
