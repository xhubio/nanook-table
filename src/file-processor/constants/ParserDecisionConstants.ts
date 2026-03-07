import { START_COLUMN } from './ParserBaseConstants.js'

/** The column the test cases starts.  */
export const START_COLUMN_TESTCASE = START_COLUMN + 5

/** The first row '0' will not be read  */
export const DECISION_START_ROW = 1

/** The column the section type  is located.  */
export const COLUMN_TYPE = START_COLUMN + 1

/** The column the name of the Equivalence class is located.  */
export const COLUMN_FIELD_EQ_CLASS = START_COLUMN + 2
/** The column the name of the generator calls are located.  */
export const COLUMN_FIELD_TDG = START_COLUMN + 3
/** The column the comment is located.  */
export const COLUMN_FIELD_COMMENT = START_COLUMN + 4

/** MURO=MultiRow. The column where the 'key' value is located.  */
export const COLUMN_MURO_KEY = START_COLUMN + 2
/** MURO=MultiRow. The column where the 'other' value is located.  */
export const COLUMN_MURO_OTHER = START_COLUMN + 3
/** MURO=MultiRow. The column where the 'comment' value is located.  */
export const COLUMN_MURO_COMMENT = START_COLUMN + 4

/** The identifier for the decision table. */
export const KEY_TABLE_START = '<DECISION_TABLE>'
