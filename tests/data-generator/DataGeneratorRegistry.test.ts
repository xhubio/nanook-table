import { test, expect } from 'vitest'
import path from 'node:path'

import { DataGeneratorRegistry } from '../../src/data-generator/DataGeneratorRegistry.js'
import { DataGeneratorBase } from '../../src/data-generator/DataGeneratorBase.js'

test('Test that registerGenerator could be retrieved', () => {
  const registry = new DataGeneratorRegistry()

  registry.registerGenerator(
    'myService',
    new DataGeneratorBase({ generatorRegistry: registry, name: 'dummy1' })
  )
  const generator = registry.getGenerator('myService')

  expect(generator.name).toEqual('myService')
})

test('Load store: useStore=false', async () => {
  const registry = new DataGeneratorRegistry()

  const gen1 = new DataGeneratorBase({
    name: 'dummy1',
    generatorRegistry: registry,
    storeName: 'simpleStore',
    varDir: path.join('tests', 'data-generator', 'fixtures')
  })

  const gen2 = new DataGeneratorBase({
    name: 'dummy2',
    generatorRegistry: registry,
    storeName: 'simpleStore2',
    varDir: path.join('tests', 'data-generator', 'fixtures')
  })

  registry.registerGenerator('gen1', gen1)
  registry.registerGenerator('gen2', gen2)

  expect(gen1.getStoreData()).toEqual({ instanceData: [], uniqueSet: [] })
  expect(gen2.getStoreData()).toEqual({ instanceData: [], uniqueSet: [] })

  await registry.loadStore()

  expect(gen1.getStoreData()).toEqual({ instanceData: [], uniqueSet: [] })
  expect(gen2.getStoreData()).toEqual({ instanceData: [], uniqueSet: [] })
})

test('Load store: useStore=true', async () => {
  const registry = new DataGeneratorRegistry()

  const gen1 = new DataGeneratorBase({
    name: 'dummy1',
    generatorRegistry: registry,
    storeName: 'simpleStore',
    varDir: path.join('tests', 'data-generator', 'fixtures'),
    useStore: true
  })

  const gen2 = new DataGeneratorBase({
    name: 'dummy2',
    generatorRegistry: registry,
    storeName: 'simpleStore2',
    varDir: path.join('tests', 'data-generator', 'fixtures'),
    useStore: true
  })

  registry.registerGenerator('gen1', gen1)
  registry.registerGenerator('gen2', gen2)

  expect(gen1.getStoreData()).toEqual({ instanceData: [], uniqueSet: [] })
  expect(gen2.getStoreData()).toEqual({ instanceData: [], uniqueSet: [] })

  await registry.loadStore()

  expect(gen1.getStoreData()).toEqual({
    instanceData: [
      ['T', 'Torsten'],
      ['H', 'Herbert'],
      ['J', 'John'],
      ['A', 'Amadir']
    ],
    uniqueSet: ['Torsten', 'Herbert', 'John', 'Amadir']
  })
  expect(gen2.getStoreData()).toEqual({
    instanceData: [
      ['TL', 'Torsten'],
      ['HB', 'Herbert'],
      ['JA', 'John'],
      ['AG', 'Amadir']
    ],
    uniqueSet: ['Torsten', 'Herbert', 'John', 'Amadir']
  })
})
