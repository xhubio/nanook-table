import { test, expect } from 'vitest'
import { getLoggerMemory } from '../../src/logger/index.js'

import {
  createDefaultGeneratorRegistry,
  createDefaultWriter,
  createDefaultFileProcessor
} from '../../src/processor/index.js'

const logger = getLoggerMemory()

test('createDefaultGeneratorRegistry', () => {
  const registry = createDefaultGeneratorRegistry()
  expect(registry).toBeDefined()
})

test('createDefaultWriter', () => {
  const writer = createDefaultWriter(logger)
  expect(writer).toBeDefined()
  expect(writer.length).toBe(1)
  expect(writer[0]).toBeDefined()
})

test('createDefaultFileProcessor', () => {
  const fileProcessor = createDefaultFileProcessor(logger)
  expect(fileProcessor).toBeDefined()
})
