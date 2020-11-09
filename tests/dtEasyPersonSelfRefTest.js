import { executeTest } from './decisionTestcaseProcessor'
import Validator from './Validator'

/**
 * test for the TestcaseProcessorDecision
 */

// eslint-disable-next-line no-unused-vars
const personSelfRefExpected = {
  Person_self_ref: {
    1: {
      'first-name': 'Herbert1',
      'last-name': 'Batz1',
      name2: 'Herbert1',
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1',
        },
        {
          comment: 'a comment 2',
          key: 'Create new Person record',
          other: 'other effect 2',
        },
      ],
    },
    2: {
      'first-name': 'Herbert2',
      'last-name': 'Batz2',
      name2: 'Herbert2',
      Effect: [
        {
          comment: 'a comment 2',
          key: 'Create new Person record',
          other: 'other effect 2',
        },
      ],
    },
    3: {
      'first-name': 'Herbert3',
      'last-name': 'Batz3',
      name2: 'Herbert1',
      Effect: [
        {
          comment: 'a comment 2',
          key: 'Create new Person record',
          other: 'other effect 2',
        },
      ],
    },
  },
}

// eslint-disable-next-line no-unused-vars
const personSelfRef = {
  excelFileName: 'dt_easy.xls',
  excelTableNames: ['Person_self_ref'],
  validator: new Validator({ expected: personSelfRefExpected }),
  tableName: 'Person_self_ref',
}

executeTest(personSelfRef)
