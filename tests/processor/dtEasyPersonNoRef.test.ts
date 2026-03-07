import { executeTest } from './decisionTestcaseProcessor.js'
import { Validator } from './Validator.js'

/**
 * test for the TestcaseProcessorDecision
 */

const expected = {
  Person_no_ref: {
    1: {
      'first-name': '<EMPTY>',
      'last-name': '<empty>',
      email: '<EMPTY>',
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1'
        }
      ]
    },
    2: {
      'first-name': 'Franziska',
      'last-name': '<empty>',
      email: 'Franzi.Hubel@frog.de',
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1'
        }
      ]
    },
    3: {
      'first-name': 'Franziska',
      'last-name': 'Hubel',
      email: '<EMPTY>',
      Effect: [
        {
          comment: 'a comment 1',
          key: 'Abort action',
          other: 'other effect 1'
        },
        {
          comment: 'a comment 2',
          key: 'Create new Person record',
          other: 'other effect 2'
        }
      ]
    },
    4: {
      'first-name': 'Franziska',
      'last-name': 'Hubel',
      email: 'Franzi.Hubel@frog.de',
      Effect: [
        {
          comment: 'a comment 2',
          key: 'Create new Person record',
          other: 'other effect 2'
        }
      ]
    }
  }
}

const personNoRef = {
  excelFileName: 'dt_easy.xls',
  excelTableNames: ['Person_no_ref'],
  validator: new Validator(expected),
  tableName: 'Person_no_ref'
}

executeTest(personNoRef)
