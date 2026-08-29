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

test('createDefaultFileProcessor registers a parser for every documented A1 marker', () => {
  const fileProcessor = createDefaultFileProcessor(logger)

  // The markers the guide documents. '<SPECIFICATION>' was silently ignored
  // before: the factory only knew '<SPECIFICATION_TABLE>', so a sheet using
  // the documented marker produced no table and no error — only an info log.
  for (const marker of [
    '<DECISION_TABLE>',
    '<MATRIX_TABLE>',
    '<SPECIFICATION>'
  ]) {
    expect(fileProcessor.getParser(marker), marker).toBeDefined()
  }

  // Legacy alias — existing workbooks keep loading.
  expect(fileProcessor.getParser('<SPECIFICATION_TABLE>')).toBeDefined()
})
