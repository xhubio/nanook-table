import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '../RuleConverterInterface.js'

/**
 * C4 rule converter. Adds an error class for invalid email
 * and appends 'Valid Email' to the 'not null' valid class comment.
 */
export const EmailConverter: RuleConverterPlugin = {
  name: 'C4',
  description: 'Email validation rule',
  convert(_context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [{ name: 'not null', comment: 'Valid Email' }],
      errorClasses: [{ name: 'C4', comment: 'Must be valid email' }]
    }
  }
}
