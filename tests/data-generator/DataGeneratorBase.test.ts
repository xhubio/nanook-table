import { test, expect, beforeAll } from 'vitest'
import path from 'node:path'
import fs from 'node:fs/promises'

import { DataGeneratorRegistry } from '../../src/data-generator/DataGeneratorRegistry.js'
import { DataGeneratorBase } from '../../src/data-generator/DataGeneratorBase.js'
import { LoggerMemory } from '../../src/logger/index.js'
import type { DataGeneratorGenerateRequest } from '../../src/data-generator/DataGeneratorInterface.js'
import type { GeneratorDirectiveInterface } from '../../src/model/directive/GeneratorDirective.js'

const VOLATILE = path.join(import.meta.dirname, 'volatile')

beforeAll(async () => {
  await fs.rm(VOLATILE, { recursive: true, force: true })
  await fs.mkdir(VOLATILE, { recursive: true })
})

test('storeFileName 1', () => {
  const generatorRegistry = new DataGeneratorRegistry()
  const gen = new DataGeneratorBase({
    generatorRegistry,
    name: 'dummy1',
    storeName: 'huhu'
  })
  expect(gen.storeFileName).toEqual('var/huhu.json')
})

test('storeFileName 2', () => {
  const generatorRegistry = new DataGeneratorRegistry()
  const gen = new DataGeneratorBase({
    generatorRegistry,
    name: 'dummy1',
    storeName: 'huhu',
    varDir: 'help'
  })
  expect(gen.storeFileName).toEqual('help/huhu.json')
})

test('loadStore: useStore=false', async () => {
  const generatorRegistry = new DataGeneratorRegistry()
  const gen = new DataGeneratorBase({
    generatorRegistry,
    name: 'dummy1',
    storeName: 'simpleStore',
    varDir: path.join('tests', 'data-generator', 'fixtures')
  })

  await gen.loadStore()
  const storeData = gen.getStoreData()

  // use store is false, so no data expected
  expect(storeData).toEqual({ instanceData: [], uniqueSet: [] })
})

test('loadStore: useStore=true', async () => {
  const generatorRegistry = new DataGeneratorRegistry()
  const gen = new DataGeneratorBase({
    generatorRegistry,
    name: 'dummy1',
    storeName: 'simpleStore',
    varDir: path.join('tests', 'data-generator', 'fixtures'),
    useStore: true
  })

  await gen.loadStore()
  const storeData = gen.getStoreData()

  expect(storeData).toEqual({
    uniqueSet: ['Torsten', 'Herbert', 'John', 'Amadir'],
    instanceData: [
      ['T', 'Torsten'],
      ['H', 'Herbert'],
      ['J', 'John'],
      ['A', 'Amadir']
    ]
  })
})

test('generate with known instanceId', async () => {
  const generatorRegistry = new DataGeneratorRegistry()
  const gen = new DataGeneratorBase({
    generatorRegistry,
    name: 'dummy1',
    storeName: 'simpleStore',
    varDir: path.join('tests', 'data-generator', 'fixtures'),
    useStore: true
  })

  await gen.loadStore()

  // The data for the instanceID 'T' was loaded by the store
  const val = await gen.generate({ instanceId: 'T' })

  expect(val).toEqual('Torsten')
})

test('saveStore: useStore=true', async () => {
  const generatorRegistry = new DataGeneratorRegistry()
  const gen = new DataGeneratorBase({
    generatorRegistry,
    name: 'dummy1',
    storeName: 'simpleStore',
    varDir: path.join('tests', 'data-generator', 'fixtures'),
    useStore: true
  })

  await gen.loadStore()
  gen.varDir = VOLATILE
  gen.storeName = 'saveStoreTest'
  await gen.saveStore()

  // load the expected File Data
  const expectedDataRaw = await fs.readFile(
    path.join(import.meta.dirname, 'fixtures', 'simpleStore.json'),
    'utf8'
  )
  const expectedData = JSON.parse(expectedDataRaw)

  const realDataRaw = await fs.readFile(
    path.join(VOLATILE, 'saveStoreTest.json'),
    'utf8'
  )
  const realData = JSON.parse(realDataRaw)

  expect(realData).toEqual(expectedData)
})

// returns its parameter with a call counter, so a cached value can be told from a new one
class GeneratorCounting extends DataGeneratorBase {
  calls = 0

  // eslint-disable-next-line require-await
  protected async doGenerate(request: DataGeneratorGenerateRequest) {
    this.calls++
    return `${request.generatorDirective?.config}#${this.calls}`
  }
}

function directive(config: string): GeneratorDirectiveInterface {
  return { config } as GeneratorDirectiveInterface
}

test('generate: same instance, different parameter gives different values', async () => {
  const gen = new GeneratorCounting({
    generatorRegistry: new DataGeneratorRegistry(),
    name: 'counting'
  })

  // all gen:: cells of a test case share the instance id of the test case
  const empty = await gen.generate({
    instanceId: 'tc1',
    generatorDirective: directive('empty')
  })
  const alpha = await gen.generate({
    instanceId: 'tc1',
    generatorDirective: directive('alpha:5')
  })

  expect(empty).toEqual('empty#1')
  expect(alpha).toEqual('alpha:5#2')
  expect(gen.calls).toEqual(2)
})

test('generate: same instance and parameter gives the cached value', async () => {
  const gen = new GeneratorCounting({
    generatorRegistry: new DataGeneratorRegistry(),
    name: 'counting'
  })

  const first = await gen.generate({
    instanceId: 'tc1',
    generatorDirective: directive('alpha:5')
  })
  const second = await gen.generate({
    instanceId: 'tc1',
    generatorDirective: directive('alpha:5')
  })
  const otherInstance = await gen.generate({
    instanceId: 'tc2',
    generatorDirective: directive('alpha:5')
  })

  expect(second).toEqual(first)
  expect(otherInstance).toEqual('alpha:5#2')
  expect(gen.calls).toEqual(2)
})

test('generate: doGenerate is called per parameter with the unchanged instance id', async () => {
  const seen: string[] = []
  class GeneratorRecord extends DataGeneratorBase {
    // eslint-disable-next-line require-await
    protected async doGenerate(request: DataGeneratorGenerateRequest) {
      seen.push(request.instanceId)
      return request.generatorDirective?.config
    }
  }
  const gen = new GeneratorRecord({
    generatorRegistry: new DataGeneratorRegistry(),
    name: 'record'
  })

  await gen.generate({
    instanceId: '1',
    generatorDirective: directive('firstName')
  })
  await gen.generate({
    instanceId: '1',
    generatorDirective: directive('email')
  })

  expect(seen).toEqual(['1', '1'])
})

test('generate: a rejecting doGenerate is logged, also without testcaseMeta', async () => {
  class GeneratorRejecting extends DataGeneratorBase {
    // eslint-disable-next-line require-await
    protected async doGenerate(request: DataGeneratorGenerateRequest) {
      throw new Error(`unknown config '${request.generatorDirective?.config}'`)
    }
  }
  const logger = new LoggerMemory()
  const gen = new GeneratorRejecting({
    generatorRegistry: new DataGeneratorRegistry(),
    name: 'rejecting',
    logger
  })

  // the directive a test builds by hand has no testcaseMeta
  const value = await gen.generate({
    instanceId: 'id1',
    generatorDirective: directive('unknown')
  })

  expect(value).toBeUndefined()
  expect(logger.entries.error).toHaveLength(1)
  expect(logger.entries.error[0].message).toMatchObject({
    message: "unknown config 'unknown'",
    tableName: 'unknown',
    generatorName: 'rejecting'
  })
})
