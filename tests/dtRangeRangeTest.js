import { executeTest } from './decisionTestcaseProcessor'
import Validator from './Validator'

/**
 * test for the TestcaseProcessorDecision
 */

// eslint-disable-next-line no-unused-vars
const expected = {
  range: {
    '1-1': { 'Field 1': '<DATA:Müller>', 'Field 2': '<GUMB>:a>' },
    '1-2': { 'Field 1': '<DATA:Schmidt>', 'Field 2': '<GUMB>:a>' },
    '1-3': { 'Field 1': '<DATA:Müller>', 'Field 2': '<GUMB>:a>' },
    '2-1': { 'Field 1': '<DATA:Schmidt>', 'Field 2': '<GUMB>:b>' },
    '2-2': { 'Field 1': '<DATA:Schmidt>', 'Field 2': '<GUMB>:b>' },
  },
}

// eslint-disable-next-line no-unused-vars
const testDefinition = {
  excelFileName: 'dt_range.xls',
  excelTableNames: ['multiplicity', 'range'],
  validator: new Validator({ expected }),
  tableName: 'range',
}

executeTest(testDefinition)
