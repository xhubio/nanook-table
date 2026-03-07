import { test, expect } from 'vitest'
import { GeneratorDirectiveInterface } from '../../../src/model/index.js'
import { DataGeneratorRegistry } from '../../../src/data-generator/DataGeneratorRegistry.js'
import { GeneratorFaker } from '../../../src/data-generator/generator/GeneratorFaker.js'

const gen = new GeneratorFaker({
  generatorRegistry: new DataGeneratorRegistry(),
  name: 'dummy1'
})

const DEFAULT: GeneratorDirectiveInterface = {
  config: '',
  fieldName: 'field1',
  generatorName: 'generator1',
  instanceIdSuffix: '',
  order: 1000,
  testcaseMeta: {
    tableName: 'table1',
    fileName: 'myFile',
    tableType: 'type1',
    testcaseName: 'testcaseName1'
  }
}

test('test GeneratorFaker', () => {
  const generatorDirective: GeneratorDirectiveInterface = {
    ...DEFAULT,
    config: 'person.firstName'
  }

  const val = gen.generate({
    instanceId: '1',
    testcaseData: { data: {} },
    generatorDirective
  })
  expect(val).toBeDefined()
})

test('test GeneratorFaker instanceid', () => {
  const generatorDirective1: GeneratorDirectiveInterface = {
    ...DEFAULT,
    config: 'person.firstName'
  }

  const generatorDirective2: GeneratorDirectiveInterface = {
    ...DEFAULT,
    config: 'person.firstName'
  }
  const val = gen.generate({
    instanceId: '3',
    testcaseData: { data: {} },
    generatorDirective: generatorDirective1
  })
  const val1 = gen.generate({
    instanceId: '3',
    testcaseData: { data: {} },
    generatorDirective: generatorDirective2
  })
  expect(val).toEqual(val1)
})
