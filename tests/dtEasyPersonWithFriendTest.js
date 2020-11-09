import { executeTest } from './decisionTestcaseProcessor'
import Validator from './Validator'

/**
 * test for the TestcaseProcessorDecision
 */

// eslint-disable-next-line no-unused-vars
const expected = {
  Person_with_friend: {
    1: {
      'first-name': 'Rudolf1',
      'last-name': 'Rentier1',
      email: 'Ruold1.rentier1@gum.de',
      friend_email: 'Franzi.Hubel@frog.de',
      friend_firstName: 'Franziska',
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
      'first-name': 'Rudolf2',
      'last-name': 'Rentier2',
      email: 'Ruold2.rentier2@gum.de',
      friend_email: 'Franzi.Hubel@frog.de',
      friend_firstName: 'Franziska',
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
const testDefinition = {
  excelFileName: 'dt_easy.xls',
  excelTableNames: ['Person_no_ref', 'Person_with_friend'],
  validator: new Validator({ expected }),
  tableName: 'Person_with_friend',
}

executeTest(testDefinition)
