import { executeTest } from './decisionTestcaseProcessor'
import Validator from './Validator'

/**
 * test for the TestcaseProcessorDecision
 */

// eslint-disable-next-line no-unused-vars
const personNoRefExpected = {
  Person_no_ref: {
    1: {
      'first-name': '<EMPTY>',
      'last-name': '<empty>',
      email: '<EMPTY>',
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1',
        },
      ],
    },
    2: {
      'first-name': 'Franziska',
      'last-name': '<empty>',
      email: 'Franzi.Hubel@frog.de',
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1',
        },
      ],
    },
    3: {
      'first-name': 'Franziska',
      'last-name': 'Hubel',
      email: '<EMPTY>',
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
    4: {
      'first-name': 'Franziska',
      'last-name': 'Hubel',
      email: 'Franzi.Hubel@frog.de',
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
const personNoRef = {
  excelFileName: 'dt_easy.xls',
  excelTableNames: ['Person_no_ref'],
  validator: new Validator({ expected: personNoRefExpected }),
  tableName: 'Person_no_ref',
}

executeTest(personNoRef)
