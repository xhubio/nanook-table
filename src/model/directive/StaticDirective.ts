import { DirectiveBase } from './DirectiveBase.js'
import type { DirectiveBaseInterface, DirectiveBaseOptions } from './DirectiveBase.js'

/**
 * Represents a directive for handling static values.
 *
 * A static directive defines a constant value specified in the generator column.
 * This value is used as-is during the test case generation process.
 */
export interface StaticDirectiveInterface extends DirectiveBaseInterface {
  /**
   * The static value assigned to this directive.
   */
  value: string
}

/**
 * Options for creating a StaticDirective instance.
 */
export interface StaticDirectiveOptions extends DirectiveBaseOptions {
  value: string
}

/**
 * Implementation of a directive for static values.
 */
export class StaticDirective extends DirectiveBase implements StaticDirectiveInterface {
  value: string

  constructor(opts: StaticDirectiveOptions) {
    super(opts)
    this.value = opts.value
  }
}
