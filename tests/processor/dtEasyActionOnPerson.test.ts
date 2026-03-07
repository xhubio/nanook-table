import { executeTest } from './decisionTestcaseProcessor.js'
import { Validator } from './Validator.js'

/**
 * test for the TestcaseProcessorDecision
 */

const expected = {
  'Action on Person': {
    'r0:c0': { Keine: '<EMPTY>', Person: '<EMPTY>' },
    'r0:c3': { 'delete email': 'Beatrice', Person: '<EMPTY>' },
    'r0:c4': { 'change last name': 'Ohhh', Person: '<EMPTY>' },
    'r1:c0': { Keine: '<EMPTY>', 'Person without email': 'Lucifer' },
    'r1:c4': { 'Person without email': 'Lucifer', 'change last name': 'Ohhh' }
  }
}

const testDefinition = {
  excelFileName: 'dt_easy.xls',
  excelTableNames: ['Person', 'Action on Person'],
  validator: new Validator(expected),
  tableName: 'Action on Person'
}

executeTest(testDefinition)
