import { test, expect } from 'vitest'
import { GeneratorDirective } from '../../../src/model/index.js'

test('Should create an instance of the GeneratorDirective', () => {
  const directive = new GeneratorDirective({
    fieldName: 'myField',
    testcaseMeta: {
      fileName: 'myFile',
      tableName: 'myTable',
      tableType: 'myTableType',
      testcaseName: 'myTestcaseName'
    },
    config: 'myConfig',
    generatorName: 'myGenerator',
    instanceIdSuffix: 'mySuffix',
    order: 1000
  })
  expect(directive).toBeDefined()
})
