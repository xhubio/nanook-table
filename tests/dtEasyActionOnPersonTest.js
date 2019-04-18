import { executeTest } from './decisionTestcaseProcessor'
import Validator from './Validator'

/**
 * test for the TestcaseProcessorDecision
 */

// eslint-disable-next-line no-unused-vars
const expected = {
  'Action on Person': {
    'r0:c0': { KEINE: '<EMPTY>', Person: '<EMPTY>' },
    'r0:c3': { 'delete email': 'Beatrice', Person: '<EMPTY>' },
    'r0:c4': { 'change last name': 'Ohhh', Person: '<EMPTY>' },
    'r1:c0': { KEINE: '<EMPTY>', 'Person without email': 'Lucifer' },
    'r1:c4': { 'Person without email': 'Lucifer', 'change last name': 'Ohhh' },
  },
}

// eslint-disable-next-line no-unused-vars
const testDefinition = {
  excelFileName: 'dt_easy.xls',
  excelTableNames: ['Person', 'Action on Person'],
  validator: new Validator({ expected }),
  tableName: 'Action on Person',
}

executeTest(testDefinition)
