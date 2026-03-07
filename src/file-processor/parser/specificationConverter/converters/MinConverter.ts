import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '../RuleConverterInterface.js'

/**
 * C2 rule converter. Adds a valid class for the minimum boundary.
 * The type-specific error class is handled by the TypeConverter.
 */
export const MinConverter: RuleConverterPlugin = {
  name: 'C2',
  description: 'Minimum value/length rule',
  convert(_context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [{ name: 'exactly min', comment: '' }],
      errorClasses: []
    }
  }
}
