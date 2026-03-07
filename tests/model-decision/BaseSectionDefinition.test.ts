import { describe, it, expect } from 'vitest'
import { SectionType } from '../../src/model-decision/index.js'
import { BaseSectionDefinition } from '../../src/model-decision/sections/BaseSectionDefinition.js'

describe('BaseSectionDefinition', () => {
  it('Create instance', () => {
    const obj = new BaseSectionDefinition({})
    expect(obj !== undefined).toBeTruthy()
  })

  it('Create instance with name', () => {
    const obj = new BaseSectionDefinition({ name: 'Gumbo' })
    expect(obj.name === 'Gumbo').toBeTruthy()
    expect(obj.sectionType === SectionType.BASE_SECTION).toBeTruthy()
  })

  it('Validate without name', () => {
    const obj = new BaseSectionDefinition({})
    const issues = obj.validate()

    expect(issues.length === 1).toBeTruthy()
  })

  it('Validate with name', () => {
    const obj = new BaseSectionDefinition({ name: 'Super object' })
    const issues = obj.validate()

    expect(issues.length === 0).toBeTruthy()
  })
})
