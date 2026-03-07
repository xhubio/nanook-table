import type { MetaTestcase } from '../MetaInterface.js'

/**
 * Represents the common data structure for all directive items.
 *
 * A directive defines a unit of work that must be completed to generate the test case data.
 * The processor will repeatedly process all directives until each one is fulfilled,
 * or it will throw an error if any remain incomplete.
 */
export interface DirectiveBaseInterface {
  /**
   * The name of the field associated with this directive.
   */
  fieldName: string

  /**
   * Meta-information about the test case.
   */
  testcaseMeta: MetaTestcase
}

/**
 * Options for initializing a DirectiveBase.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DirectiveBaseOptions extends DirectiveBaseInterface {}

/**
 * Abstract base class for directives.
 *
 * Provides the essential properties for all directives and serves as a foundation
 * for more specific implementations.
 */
export abstract class DirectiveBase implements DirectiveBaseInterface {
  fieldName: string
  testcaseMeta: MetaTestcase

  /**
   * Constructs a new instance of DirectiveBase.
   *
   * @param opts - An object conforming to DirectiveBaseInterface that provides the necessary initialization data.
   */
  constructor(opts: DirectiveBaseInterface) {
    this.fieldName = opts.fieldName
    this.testcaseMeta = opts.testcaseMeta
  }
}
