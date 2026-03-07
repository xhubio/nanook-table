import { test, expect } from 'vitest'
import { LoggerMemory } from '../../src/logger/index.js'

test('Get instance', () => {
  const logger = new LoggerMemory()
  expect(logger !== undefined).toBeTruthy()
})

test('Log error object', () => {
  const logger = new LoggerMemory()
  // Cleanup old log entries
  logger.clear()
  logger.error({ name: 'gumbo' })

  const errors = logger.entries.error
  errors[0].time = 'dummy'

  expect(errors).toEqual([
    { message: { name: 'gumbo' }, level: 'error', time: 'dummy' }
  ])
})

test('Log warning string when level is on error', () => {
  const logger = new LoggerMemory()
  // Cleanup old log entries
  logger.clear()
  logger.warning('Hey you, whats up')
  expect(logger.entries.warning.length).toBe(0)
})

test('Log warning string when level is on warning', () => {
  const logger = new LoggerMemory()
  // Cleanup old log entries
  logger.clear()
  logger.level = 'warning'

  logger.warning('Hey you, whats up')

  const warn = logger.entries.warning
  warn[0].time = 'dummy'

  expect(warn).toEqual([
    { message: 'Hey you, whats up', level: 'warning', time: 'dummy' }
  ])
})
