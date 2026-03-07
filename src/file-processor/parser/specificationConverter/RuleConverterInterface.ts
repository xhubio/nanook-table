import type {
  SpecificationFieldRuleInterface,
  SpecificationFieldInterface,
  SpecificationInterface
} from '../SpecificationInterface.js'

export interface RuleConverterPlugin {
  name: string
  description: string
  convert(context: RuleConversionContext): EquivalenceClassResult
}

export interface RuleConversionContext {
  field: SpecificationFieldInterface
  rule: SpecificationFieldRuleInterface
  allFieldRules: SpecificationFieldRuleInterface[]
  specification: SpecificationInterface
}

export interface EquivalenceClassResult {
  validClasses: EquivalenceClassEntry[]
  errorClasses: EquivalenceClassEntry[]
}

export interface EquivalenceClassEntry {
  name: string
  comment: string
  /** Optional severity override. When set, this severity is used instead of the current rule's severity. */
  severity?: string
}

// Keep these internal types - they're used by ParserSpecificationConverter
export type FieldRules = Record<string, SpecificationFieldRuleInterface>
export interface EquivalenceClasses {
  valid: Record<string, { comment: string[] }>
  error: Record<string, { comment: string[]; severity: string[] }>
}
