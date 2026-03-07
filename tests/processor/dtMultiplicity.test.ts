import { executeTest } from './decisionTestcaseProcessor.js'
import { Validator } from './Validator.js'

/**
 * test for the TestcaseProcessorDecision
 */

const expected = {
  multiplicity: {
    1: {
      email: '<DATA:elva.watz@gum.de>',
      'first-name': '<DATA:Maria>',
      'last-name': '<DATA:Schmidt>'
    },
    2.1: {
      email: '<DATA:elva.watz@gum.de>',
      'first-name': '<DATA:Maria>',
      'last-name': '<DATA:Müller>'
    },
    2.2: {
      email: '<DATA:elva.watz@gum.de>',
      'first-name': '<DATA:Maria>',
      'last-name': '<DATA:Müller>'
    },
    2.3: {
      email: '<DATA:elva.watz@gum.de>',
      'first-name': '<DATA:Maria>',
      'last-name': '<DATA:Müller>'
    },
    4: {
      email: '<DATA:nadine.grüft@wupp.com>',
      'first-name': '<DATA:Maria>',
      'last-name': '<DATA:Müller>'
    }
  }
}

const testDefinition = {
  excelFileName: 'dt_multiplicity.xls',
  excelTableNames: ['multiplicity'],
  validator: new Validator(expected),
  tableName: 'multiplicity'
}

executeTest(testDefinition)
