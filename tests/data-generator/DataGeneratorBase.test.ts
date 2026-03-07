import { test, expect, beforeAll } from 'vitest'
import path from 'node:path'
import fs from 'node:fs/promises'

import { DataGeneratorRegistry } from '../../src/data-generator/DataGeneratorRegistry.js'
import { DataGeneratorBase } from '../../src/data-generator/DataGeneratorBase.js'

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
