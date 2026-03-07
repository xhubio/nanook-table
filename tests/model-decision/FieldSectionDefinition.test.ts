import { describe, it, expect } from 'vitest'
import {
  FieldSectionDefinition,
  SectionType
} from '../../src/model-decision/index.js'

describe('FieldSectionDefinition', () => {
  it('Create instance', () => {
    const obj = new FieldSectionDefinition({})
    const headerId = obj.headerRow
    expect(obj !== undefined).toBeTruthy()

    expect(obj).toEqual({
      sectionType: SectionType.FIELD_SECTION,
      _dataRows: [],
      headerRow: headerId,
      subSections: {},
      mandatory: true,
      multiple: true,
      multiInstancesAllowed: true,
      tdgMandatory: false
    })
  })

  it('Get new empty section', () => {
    const obj = new FieldSectionDefinition({ name: 'Gumbo' })
    const field1 = obj.createNewField()
    const field2 = obj.createNewField()

    const fieldId1 = field1.headerRow
    const fieldId2 = field2.headerRow

    field1.createNewRow()
    field1.createNewRow()

    field2.createNewRow()
    field2.createNewRow()
    field2.createNewRow()

    expect(obj.subSections[fieldId1].dataRows.length === 2).toBeTruthy()
    expect(obj.subSections[fieldId2].dataRows.length === 3).toBeTruthy()
  })

  describe('Validate', () => {
    it('Entry with no issues', () => {
      const obj = new FieldSectionDefinition({ name: 'gum' })
      obj.createNewRow()
      obj.createNewRow()

      const issues = obj.validate()
      expect(issues.length === 0).toBeTruthy()
    })

    it('Entry without any subSection', () => {
      const obj = new FieldSectionDefinition({ name: 'gum' })

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()
      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: 'A fieldSection needs at least one sub section',
          level: 'ERROR'
        }
      ])
    })
  })
})
