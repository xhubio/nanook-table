import { test, expect } from 'vitest'
import type { FilterInterface } from '../../src/model/index.js'

test('Instantiate', () => {
  const filter: FilterInterface = {
    expression: '',
    filterProcessorName: '',
    comment: ''
  }

  expect(filter).toBeDefined()
})
