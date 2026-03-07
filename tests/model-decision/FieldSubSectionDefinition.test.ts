import { describe, it, expect } from 'vitest'
import {
  FieldSubSectionDefinition,
  SectionType
} from '../../src/model-decision/index.js'

describe('FieldSubSectionDefinition', () => {
  it('Create instance', () => {
    const obj = new FieldSubSectionDefinition({ parent: 'a' })
    expect(obj !== undefined).toBeTruthy()
    expect(obj.sectionType === SectionType.FIELD_SUB_SECTION).toBeTruthy()
  })

  it('Get new empty section', () => {
    const obj = new FieldSubSectionDefinition({ name: 'Gumbo', parent: 'a' })
    obj.createNewRow()

    expect(obj.name).toEqual('Gumbo')
    expect(obj.getRowIds().length).toEqual(2)
  })

  describe('Validate', () => {
    it('Entry with no issues', () => {
      const obj = new FieldSubSectionDefinition({ name: 'gum', parent: 'a' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.equivalenceClasses[row1] = 'name 1'
      obj.equivalenceClasses[row2] = 'name 2'

      obj.comments[row1] = 'abc'
      obj.tdgs[row2] = 'xzy'

      const issues = obj.validate()
      expect(issues.length === 0).toBeTruthy()
    })

    it('Entry with missing mandatory key entry', () => {
      const obj = new FieldSubSectionDefinition({ name: 'gum', parent: 'a' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.equivalenceClasses[row1] = 'name 1'
      // obj.equivalenceClasses[row2] = 'name 2';

      obj.comments[row1] = 'abc'
      obj.comments[row2] = 'abc'

      obj.tdgs[row1] = 'xzy'
      obj.tdgs[row2] = 'xzy'

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()

      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: 'The equivalenceClasses fields must must not be empty',
          rowId: row2,
          level: 'ERROR'
        }
      ])
    })

    it('Entry with missing mandatory equivalenceClass entry but set mandatory to false', () => {
      const obj = new FieldSubSectionDefinition({
        name: 'gum',
        mandatory: false,
        parent: 'a'
      })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.equivalenceClasses[row1] = 'name 1'
      // obj.equivalenceClasses[row2] = 'name 2';

      obj.comments[row1] = 'abc'
      obj.comments[row2] = 'abc'

      obj.tdgs[row1] = 'xzy'
      obj.tdgs[row2] = 'xzy'

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()

      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: 'The equivalenceClasses fields must must not be empty',
          rowId: row2,
          level: 'ERROR'
        }
      ])
    })

    it('Entry with same key entry', () => {
      const obj = new FieldSubSectionDefinition({ name: 'gum', parent: 'a' })

      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()
      const row3 = obj.createNewRow()

      obj.equivalenceClasses[row1] = 'name 1'
      obj.equivalenceClasses[row2] = 'name 2'
      obj.equivalenceClasses[row3] = 'name 1'

      obj.comments[row1] = 'my comment'
      obj.comments[row2] = 'my comment'
      obj.comments[row3] = 'my comment'

      obj.tdgs[row1] = 'xzy'
      obj.tdgs[row2] = 'xzy'
      obj.tdgs[row3] = 'xzy'

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()

      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: `The key value 'name 1' is double to line '${row1}'`,
          rowId: row3,
          level: 'WARNING'
        }
      ])
    })

    it('Entry with missing mandatory equivalenceClass entry but set mandatory to false', () => {
      const obj = new FieldSubSectionDefinition({
        name: 'gum',
        tdgMandatory: true,
        parent: 'a'
      })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.equivalenceClasses[row1] = 'name 1'
      obj.equivalenceClasses[row2] = 'name 2'

      obj.comments[row1] = 'abc'
      obj.comments[row2] = 'abc'

      obj.tdgs[row1] = 'xzy'
      // obj.tdgs[row2] = 'xzy';

      const issues = obj.validate()
      expect(issues.length).toEqual(1)

      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: 'The tdg fields must must not be empty',
          rowId: row2,
          level: 'ERROR'
        }
      ])
    })
  })
})
