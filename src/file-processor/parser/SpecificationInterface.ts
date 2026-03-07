/** Defines the data model for an imported specification table */
export interface SpecificationInterface {
  /** The name of this specification */
  name: string

  /** The order of the fields */
  fieldOrder: string[]

  /** All the fields by there name */
  fields: Record<string, SpecificationFieldInterface>

  /** all the serverities */
  severities: string[]

  /** All the rules by there name */
  rules: Record<string, SpecificationRuleInterface>
}

export interface SpecificationFieldInterface {
  /** The name of the field */
  name: string

  /** The internal field name */
  fieldNameInternal: string

  /** all the rules of this field */
  rules: SpecificationFieldRuleInterface[]
}

/** A rule for a field */
export interface SpecificationFieldRuleInterface {
  /** The rule name/id  */
  ruleName: string
  /** A value for this rule. Depends on the type of rule */
  value: string
  /** The serverity when this rule is failing */
  severity: string
}

/** The rule details */
export interface SpecificationRuleInterface {
  /** The rule name/id is also used to assign a rule to a field */
  ruleName: string

  /** A short description for the rule name */
  shortDesc: string

  /** A long description for this rule */
  longDesc: string
}
