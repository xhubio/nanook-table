import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '../RuleConverterInterface.js'

/**
 * C1 rule converter. Adds an error class for mandatory fields.
 */
export const MandatoryConverter: RuleConverterPlugin = {
  name: 'C1',
  description: 'Mandatory field rule',
  convert(_context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [],
      errorClasses: [{ name: 'C1', comment: 'Mandatory Field' }]
    }
  }
}
