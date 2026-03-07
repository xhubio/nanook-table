import type { FieldDirectiveInterface } from './directive/FieldDirective.js'
import type { GeneratorDirectiveInterface } from './directive/GeneratorDirective.js'
import type { ReferenceDirectiveInterface } from './directive/ReferenceDirective.js'
import type { StaticDirectiveInterface } from './directive/StaticDirective.js'

/**
 * Represents all the directives associated with a single test case.
 *
 * A directive defines a specific task or operation that must be executed
 * to construct the test case and/or generate its associated data.
 */
export interface TestcaseDirectivesInterface {
  /**
   * Directives for invoking data generators.
   */
  generator: GeneratorDirectiveInterface[]

  /**
   * Directives for resolving references between test cases.
   */
  reference: ReferenceDirectiveInterface[]

  /**
   * Directives for assigning static values.
   */
  static: StaticDirectiveInterface[]

  /**
   * Directives for processing field metadata.
   */
  field: FieldDirectiveInterface[]
}
