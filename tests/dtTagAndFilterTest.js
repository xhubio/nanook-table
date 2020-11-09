import { executeTest } from './decisionTestcaseProcessor'
import Validator from './Validator'

/**
 * test for the TestcaseProcessorDecision
 */

// eslint-disable-next-line no-unused-vars
const addressExpected = {
  Address: {
    '1-1': { street: 'street_func 2', number: 'num_func 3' },
    '1-2': { street: 'street_func 2', number: 'num_func 3' },
    '1-3': { street: 'street_func 2', number: 'num_func 3' },
    '1-4': { street: 'street_func 2', number: 'num_func 3' },
    '2-1': { street: 'street_func 1', number: 'num_func 4' },
    // '2-2': { street: 'street_func 1', number: 'num_func 4' },
    '2-3': { street: 'street_func 1', number: 'num_func 4' },
    '2-4': { street: 'street_func 1', number: 'num_func 4' },
    '3-1': { street: 'street_func 2', number: 'num_func 3' },
    '3-2': { street: 'street_func 2', number: 'num_func 3' },
    '3-3': { street: 'street_func 2', number: 'num_func 3' },
    '3-4': { street: 'street_func 2', number: 'num_func 3' },
    // '4-1': { street: 'street_func 1', number: 'num_func 4' },
    // '4-2': { street: 'street_func 1', number: 'num_func 4' },
    '4-3': { street: 'street_func 1', number: 'num_func 4' },
    '4-4': { street: 'street_func 1', number: 'num_func 4' },
    5: { street: 'street_func 2', number: 'num_func 3' },
    6: { street: 'street_func 1', number: 'num_func 4' },
    7: { street: 'street_func 2', number: 'num_func 3' },
    8: { street: 'street_func 2', number: 'num_func 4' },
  },
}

// eslint-disable-next-line no-unused-vars
const addressTable = {
  excelFileName: 'decision_tag_and_filter.xls',
  excelTableNames: ['Person', 'Address'],
  validator: new Validator({ expected: addressExpected }),
  tableName: 'Address',
}

executeTest(addressTable)
