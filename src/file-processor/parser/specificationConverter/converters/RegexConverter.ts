import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '../RuleConverterInterface.js'

/**
 * C5 rule converter. Adds an error class for regex mismatch
 * and appends 'Matches RegEx' to the 'not null' valid class comment.
 */
export const RegexConverter: RuleConverterPlugin = {
  name: 'C5',
  description: 'Regular expression validation rule',
  convert(_context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [{ name: 'not null', comment: 'Matches RegEx' }],
      errorClasses: [{ name: 'C5', comment: 'Must match the given RegEx' }]
    }
  }
}
