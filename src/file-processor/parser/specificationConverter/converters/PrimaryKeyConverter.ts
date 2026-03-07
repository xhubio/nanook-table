import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult
} from '../RuleConverterInterface.js'

/**
 * PK rule converter. Primary key fields are handled at the section level
 * (secondary data section), not at the equivalence class level.
 * This converter produces no equivalence classes.
 */
export const PrimaryKeyConverter: RuleConverterPlugin = {
  name: 'PK',
  description: 'Primary key field marker',
  convert(_context: RuleConversionContext): EquivalenceClassResult {
    return {
      validClasses: [],
      errorClasses: []
    }
  }
}
