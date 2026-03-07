import { test, expect } from 'vitest'
import { StaticDirective } from '../../../src/model/index.js'

test('Should create an instance of the StaticDirective', () => {
  const directive = new StaticDirective({
    fieldName: 'myField',
    testcaseMeta: {
      fileName: 'myFile',
      tableName: 'myTable',
      tableType: 'myTableType',
      testcaseName: 'myTestcaseName'
    },
    value: 'myValue'
  })
  expect(directive).toBeDefined()
})
