import { executeTest } from './decisionTestcaseProcessor.js'
import { ValidatorObject } from './ValidatorObject.js'

/**
 * In this case the reference does not have a field name.
 * So we need to check the complete data of the target table
 */

const expected = {
  rangeObject: {
    '1-1': {
      source: { 'Field 2': '<GUMB>:a>' },
      target: {
        email: '<DATA:elva.watz@gum.de>',
        'first-name': '<DATA:Maria>',
        'last-name': '<DATA:Müller>'
      }
    },
    '1-2': {
      source: { 'Field 2': '<GUMB>:a>' },
      target: {
        email: '<DATA:nadine.grüft@wupp.com>',
        'first-name': '<DATA:Maria>',
        'last-name': '<DATA:Schmidt>'
      }
    },
    '1-3': {
      source: { 'Field 2': '<GUMB>:a>' },
      target: {
        email: '<DATA:nadine.grüft@wupp.com>',
        'first-name': '<DATA:Maria>',
        'last-name': '<DATA:Müller>'
      }
    },
    '2-1': {
      source: { 'Field 2': '<GUMB>:b>' },
      target: {
        email: '<DATA:elva.watz@gum.de>',
        'first-name': '<DATA:Maria>',
        'last-name': '<DATA:Schmidt>'
      }
    },
    '2-2': {
      source: { 'Field 2': '<GUMB>:b>' },
      target: {
        email: '<DATA:elva.watz@gum.de>',
        'first-name': '<DATA:Emeli>',
        'last-name': '<DATA:Schmidt>'
      }
    }
  }
}

const testDefinition = {
  excelFileName: 'dt_range.xls',
  excelTableNames: ['multiplicity', 'rangeObject'],
  validator: new ValidatorObject({ expected, targetTableName: 'multiplicity' }),
  tableName: 'rangeObject'
}

executeTest(testDefinition)
