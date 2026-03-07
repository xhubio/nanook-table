import { test, expect } from 'vitest'
import { SimpleArrayFilterProcessor } from '../../../src/processor/index.js'

test('SimpleArrayFilterProcessor default values', () => {
  const filterProcessor = new SimpleArrayFilterProcessor()

  expect(filterProcessor.name).toEqual('SimpleArrayFilter')
  expect(filterProcessor.delimiter).toEqual(';')
})

test('SimpleArrayFilterProcessor with other name', () => {
  const filterProcessor = new SimpleArrayFilterProcessor({
    name: 'GumboFilter'
  })

  expect(filterProcessor.name).toEqual('GumboFilter')
})

test('SimpleArrayFilterProcessor with other delimiter', () => {
  const filterProcessor = new SimpleArrayFilterProcessor({ delimiter: ',' })

  expect(filterProcessor.delimiter).toEqual(',')
})

test('filter: empty expression are always false', () => {
  const filterProcessor = new SimpleArrayFilterProcessor()

  const tags: string[] = []
  const expression = ''
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeFalsy()
})

test('filter: empty tags are always false', () => {
  const filterProcessor = new SimpleArrayFilterProcessor()

  const tags: string[] = []
  const expression = 'Prio1'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeFalsy()
})

test('filter: many tags one matching expression', () => {
  const filterProcessor = new SimpleArrayFilterProcessor()

  const tags = ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  const expression = 'Prio 3'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeTruthy()
})

test('filter: many tags one matching expression other not matching', () => {
  const filterProcessor = new SimpleArrayFilterProcessor()

  const tags = ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  const expression = ' Prio 3 ; gumbo'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeTruthy()
})

test('filter: many tags no matching expression at all ', () => {
  const filterProcessor = new SimpleArrayFilterProcessor()

  const tags = ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  const expression = ' Prio ; gumbo; Prio 5'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeFalsy()
})
