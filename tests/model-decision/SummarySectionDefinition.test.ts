import { describe, it, expect } from 'vitest'
import { SectionType, SummarySectionDefinition } from '../../src/model-decision/index.js'

describe('SummarySectionDefinition', () => {
  it('Create instance', () => {
    const obj = new SummarySectionDefinition({})
    expect(obj !== undefined).toBeTruthy()
  })

  it('Create instance with name', () => {
    const obj = new SummarySectionDefinition({ name: 'Gumbo' })
    expect(obj.name === 'Gumbo').toBeTruthy()
    expect(obj.sectionType === SectionType.SUMMARY_SECTION).toBeTruthy()
  })

  it('Validate without name', () => {
    const obj = new SummarySectionDefinition({})
    const issues = obj.validate()

    expect(issues.length === 1).toBeTruthy()
  })

  it('Validate with name', () => {
    const obj = new SummarySectionDefinition({ name: 'Super object' })
    const issues = obj.validate()

    expect(issues.length === 0).toBeTruthy()
  })
})
