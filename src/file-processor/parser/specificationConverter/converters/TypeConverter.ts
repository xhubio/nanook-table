import type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult,
  EquivalenceClassEntry
} from '../RuleConverterInterface.js'
import type { SpecificationFieldRuleInterface } from '../../SpecificationInterface.js'

/**
 * Finds a rule by its uppercase name in the allFieldRules array.
 */
function findRule(
  allFieldRules: SpecificationFieldRuleInterface[],
  name: string
): SpecificationFieldRuleInterface | undefined {
  return allFieldRules.find(
    (r) =>
      (typeof r.ruleName === 'string'
        ? r.ruleName.toUpperCase()
        : r.ruleName) === name
  )
}

/**
 * Computes the set of valid class names that exist before TYPE processing.
 * This matches the base classes created by the other converters
 * and the initial 'not null' class.
 */
function getExistingValidClassNames(
  allFieldRules: SpecificationFieldRuleInterface[]
): string[] {
  const c1 = findRule(allFieldRules, 'C1')
  const c2 = findRule(allFieldRules, 'C2')
  const c3 = findRule(allFieldRules, 'C3')

  const names: string[] = ['not null']

  if (c1 === undefined) {
    names.push('null')
  }

  if (c2 !== undefined) {
    names.push('exactly min')
  }

  if (c3 !== undefined) {
    names.push('exactly max')
  }

  return names
}

/**
 * TYPE rule converter. Generates type-specific equivalence classes.
 *
 * This converter handles the complex logic of:
 * - Adding type-specific valid classes (e.g., naughty strings for string type)
 * - Creating type-specific C2/C3 error classes with appropriate messages
 * - Appending min/max comments to ALL existing valid classes
 * - Adding boolean error class for boolean type
 */
export const TypeConverter: RuleConverterPlugin = {
  name: 'TYPE',
  description: 'Field type rule',
  convert(context: RuleConversionContext): EquivalenceClassResult {
    const { rule, allFieldRules } = context
    const lcType = rule.value.toLowerCase()

    const validClasses: EquivalenceClassEntry[] = []
    const errorClasses: EquivalenceClassEntry[] = []

    const c2 = findRule(allFieldRules, 'C2')
    const c3 = findRule(allFieldRules, 'C3')
    const c4 = findRule(allFieldRules, 'C4')
    const c5 = findRule(allFieldRules, 'C5')

    // Compute valid class names that exist before type-specific classes
    const baseValidNames = getExistingValidClassNames(allFieldRules)

    // ---------------------------
    // String
    // ---------------------------
    if (lcType === 'string') {
      // If there is no regex and no email class defined, add some other valid strings
      const additionalStringNames: string[] = []
      if (c4 === undefined && c5 === undefined) {
        const validStrings = ['naughty strings', 'number', 'float', 'boolean']
        for (const name of validStrings) {
          validClasses.push({ name, comment: 'name' })
          additionalStringNames.push(name)
        }
      }

      // All valid class names including the ones just added
      const allValidNames = [...baseValidNames, ...additionalStringNames]

      if (c2 !== undefined) {
        // minimum string length
        errorClasses.push({
          name: 'C2',
          comment: `Fall below min ${c2.value} chars`,
          severity: c2.severity
        })
        // Append min comment to ALL valid classes
        for (const name of allValidNames) {
          validClasses.push({
            name,
            comment: `Min ${c2.value} chars`
          })
        }
      }

      if (c3 !== undefined) {
        // maximum string length
        errorClasses.push({
          name: 'C3',
          comment: `Exeeds max ${c3.value} chars`,
          severity: c3.severity
        })
        // Append max comment to ALL valid classes
        for (const name of allValidNames) {
          validClasses.push({
            name,
            comment: `Max ${c3.value} chars`
          })
        }
      }
    }

    // ---------------------------
    // Date
    // ---------------------------
    if (lcType === 'date') {
      if (c2 !== undefined) {
        errorClasses.push({
          name: 'C2',
          comment: `Fall below min ${c2.value} date`,
          severity: c2.severity
        })
        for (const name of baseValidNames) {
          validClasses.push({
            name,
            comment: `Min ${c2.value} date`
          })
        }
      }
      if (c3 !== undefined) {
        errorClasses.push({
          name: 'C3',
          comment: `Exeeds max ${c3.value} date`,
          severity: c3.severity
        })
        for (const name of baseValidNames) {
          validClasses.push({
            name,
            comment: `Max ${c3.value} date`
          })
        }
      }
    }

    // ---------------------------
    // Integer or float
    // ---------------------------
    if (lcType === 'integer' || lcType === 'float') {
      if (c2 !== undefined) {
        errorClasses.push({
          name: 'C2',
          comment: `Fall below min ${c2.value}`,
          severity: c2.severity
        })
        for (const name of baseValidNames) {
          validClasses.push({
            name,
            comment: `Min ${c2.value}`
          })
        }
      }
      if (c3 !== undefined) {
        errorClasses.push({
          name: 'C3',
          comment: `Exeeds max ${c3.value}`,
          severity: c3.severity
        })
        for (const name of baseValidNames) {
          validClasses.push({
            name,
            comment: `Max ${c3.value}`
          })
        }
      }
    }

    // ---------------------------
    // Boolean
    // ---------------------------
    if (lcType === 'boolean') {
      errorClasses.push({
        name: 'boolean',
        comment: 'Not a boolean value'
      })
    }

    return { validClasses, errorClasses }
  }
}
