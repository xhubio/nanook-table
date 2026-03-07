import { describe, it, expect } from 'vitest'
import { MultiRowSectionDefinition, SectionType } from '../../src/model-decision/index.js'

describe('MultiRowSectionDefinition', () => {
  it('Create instance', () => {
    const obj = new MultiRowSectionDefinition({})
    expect(obj !== undefined).toBeTruthy()
    expect(obj.sectionType === SectionType.MULTI_ROW_SECTION).toBeTruthy()
  })

  it('Get new empty section', () => {
    const obj = new MultiRowSectionDefinition({ name: 'Gumbo' })
    obj.createNewRow()
    obj.createNewRow()
    obj.createNewRow()
    expect(obj.name === 'Gumbo').toBeTruthy()
    expect(obj.sectionType).toEqual(SectionType.MULTI_ROW_SECTION)
    expect(obj.getRowIds().length).toEqual(4)
  })

  describe('addRow', () => {
    it('No parameter given adds an empty entry', () => {
      const obj = new MultiRowSectionDefinition({})
      const headerId = obj.headerRow
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      expect(obj).toEqual({
        keys: {},
        comments: {},
        others: {},
        sectionType: SectionType.MULTI_ROW_SECTION,
        mandatory: false,
        multiple: true,
        multiInstancesAllowed: true,
        headerRow: headerId,
        _dataRows: [row1, row2]
      })
    })
  })

  describe('Validate', () => {
    it('Entry with no issues', () => {
      const obj = new MultiRowSectionDefinition({ name: 'gum' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.keys[row1] = 'MyKey'
      obj.keys[row2] = 'MyKey 1'

      obj.comments[row1] = 'my comment'
      obj.comments[row2] = 'my comment 1'

      const issues = obj.validate()
      expect(issues.length === 0).toBeTruthy()
    })

    it('Entry with missing mandatory key entry', () => {
      const obj = new MultiRowSectionDefinition({ name: 'gum' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.keys[row1] = 'MyKey'
      // obj.keys[row2] = 'MyKey 1';

      obj.comments[row1] = 'my comment'
      obj.comments[row2] = 'my comment 1'

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()

      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: 'The key fields must exist',
          rowId: row2,
          level: 'ERROR'
        }
      ])
    })

    it('Entry with same key entry', () => {
      const obj = new MultiRowSectionDefinition({ name: 'gum' })

      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()
      const row3 = obj.createNewRow()

      obj.keys[row1] = 'MyKey 1'
      obj.keys[row2] = 'MyKey 2'
      obj.keys[row3] = 'MyKey 1'

      obj.comments[row1] = 'my comment'
      obj.comments[row2] = 'my comment'
      obj.comments[row3] = 'my comment'

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()
      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: `The key value 'MyKey 1' is duplicated with row '${row1}'`,
          rowId: row3,
          level: 'WARNING'
        }
      ])
    })
  })
})
