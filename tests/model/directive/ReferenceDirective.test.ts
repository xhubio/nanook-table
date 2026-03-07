import { test, expect } from 'vitest'
import { ReferenceDirective } from '../../../src/model/index.js'

test('Should create an instance of the ReferenceDirective', () => {
  const directive = new ReferenceDirective({
    fieldName: 'myField',
    testcaseMeta: {
      fileName: 'myFile',
      tableName: 'myTable',
      tableType: 'myTableType',
      testcaseName: 'myTestcaseName'
    },
    instanceIdSuffix: 'mySuffix',
    targetFieldName: 'myTargetFieldName',
    targetTableName: 'myTargetTableName',
    targetTestcaseName: 'myTargetTestcaseName'
  })
  expect(directive).toBeDefined()
})
