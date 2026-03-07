import { describe, it, expect } from 'vitest'
import {
  GeneratorSwitchSectionDefinition,
  SectionType
} from '../../src/model-decision/index.js'

describe('GeneratorSwitchSectionDefinition', () => {
  it('Create instance', () => {
    const obj = new GeneratorSwitchSectionDefinition({})
    expect(obj !== undefined).toBeTruthy()
    expect(
      obj.sectionType === SectionType.GENERATOR_SWITCH_SECTION
    ).toBeTruthy()
  })

  it('Get new empty section', () => {
    const obj = new GeneratorSwitchSectionDefinition({ name: 'Gumbo' })
    obj.createNewRow()
    obj.createNewRow()
    obj.createNewRow()
    expect(obj.name === 'Gumbo').toBeTruthy()
    expect(obj.sectionType).toEqual(SectionType.GENERATOR_SWITCH_SECTION)
    expect(obj.getRowIds().length).toEqual(4)
  })

  describe('addRow', () => {
    it('No parameter given adds an empty entry', () => {
      const obj = new GeneratorSwitchSectionDefinition({})
      const headerId = obj.headerRow
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      expect(obj).toEqual({
        generatorNames: {},
        comments: {},
        values: {},
        sectionType: SectionType.GENERATOR_SWITCH_SECTION,
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
      const obj = new GeneratorSwitchSectionDefinition({ name: 'gum' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.generatorNames[row1] = 'MyKey'
      obj.generatorNames[row2] = 'MyKey 1'

      obj.values[row1] = 'exp 1'
      obj.values[row2] = 'exp 2'

      const issues = obj.validate()
      expect(issues.length === 0).toBeTruthy()
    })

    it('Entry with missing mandatory filterProcessorName entry', () => {
      const obj = new GeneratorSwitchSectionDefinition({ name: 'gum' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.generatorNames[row1] = 'MyKey'
      // obj.generatorNames[row2] = 'MyKey 1';

      obj.values[row1] = 'exp 1'
      obj.values[row2] = 'exp 2'

      const issues = obj.validate()
      expect(issues.length === 1).toBeTruthy()

      expect(issues).toEqual([
        {
          section: obj,
          type: 'definition',
          message: 'The generatorNames field must exist for each row',
          rowId: row2,
          level: 'ERROR'
        }
      ])
    })

    it('Entry with missing mandatory expression entry', () => {
      const obj = new GeneratorSwitchSectionDefinition({ name: 'gum' })
      const row1 = obj.createNewRow()
      const row2 = obj.createNewRow()

      obj.generatorNames[row1] = 'MyKey'
      obj.generatorNames[row2] = 'MyKey 1'

      obj.values[row1] = 'exp 1'
      // obj.values[row2] = 'exp 2'

      const issues = obj.validate()
      expect(issues.length === 0).toBeTruthy()
    })
  })
})
