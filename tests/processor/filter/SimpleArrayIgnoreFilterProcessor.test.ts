import { test, expect } from 'vitest'
import { SimpleArrayIgnoreFilterProcessor } from '../../../src/processor/index.js'

test('SimpleArrayIgnoreFilterProcessor default values', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor()

  expect(filterProcessor.name).toEqual('SimpleArrayIgnoreFilter')
  expect(filterProcessor.delimiter).toEqual(';')
})

test('SimpleArrayIgnoreFilterProcessor with other name', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor({
    name: 'GumboFilter'
  })

  expect(filterProcessor.name).toEqual('GumboFilter')
})

test('SimpleArrayIgnoreFilterProcessor with other delimiter', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor({
    delimiter: ','
  })

  expect(filterProcessor.delimiter).toEqual(',')
})

test('filter: empty expression are always true', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor()

  const tags: string[] = []
  const expression = ''
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeTruthy()
})

test('filter: empty tags are always true', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor()

  const tags: string[] = []
  const expression = 'Prio1'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeTruthy()
})

test('filter: many tags one matching expression', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor()

  const tags = ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  const expression = 'Prio 3'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeFalsy()
})

test('filter: many tags one matching expression other not matching', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor()

  const tags = ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  const expression = ' Prio 3 ; gumbo'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeFalsy()
})

test('filter: many tags no matching expression at all ', () => {
  const filterProcessor = new SimpleArrayIgnoreFilterProcessor()

  const tags = ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  const expression = ' Prio ; gumbo; Prio 5'
  const res = filterProcessor.filter(tags, expression)

  expect(res).toBeTruthy()
})
