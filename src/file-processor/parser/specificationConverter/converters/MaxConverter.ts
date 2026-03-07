import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '../RuleConverterInterface.js'

/**
 * C3 rule converter. Adds a valid class for the maximum boundary.
 * The type-specific error class is handled by the TypeConverter.
 */
export const MaxConverter: RuleConverterPlugin = {
  name: 'C3',
  description: 'Maximum value/length rule',
  convert(_context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [{ name: 'exactly max', comment: '' }],
      errorClasses: []
    }
  }
}
