import { START_COLUMN } from './ParserBaseConstants.js'

/** Defines all the default rules of the specification table. */
export const RULE: Record<string, string> = {
  PK: 'Primary Key',
  TYPE: 'Field Type',
  C1: 'Mandatory',
  C2: 'Minimum',
  C3: 'Maximum',
  C4: 'Email',
  C5: 'Regular Expression'
}

/** The column the rules starts.  */
export const START_COLUMN_RULE = START_COLUMN + 2
/** The key string to identifiy the severity rows. */
export const KEY_SEVERITY = 'Severity'
/** The key string to identifiy the rule rows. */
export const KEY_RULE = 'Rule'
