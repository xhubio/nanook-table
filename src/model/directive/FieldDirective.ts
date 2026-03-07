import { DirectiveBase } from './DirectiveBase.js'
import type { DirectiveBaseInterface, DirectiveBaseOptions } from './DirectiveBase.js'

/**
 * Represents a directive for handling field metadata values.
 *
 * A field directive corresponds to a value specified in the generator column,
 * typically representing the value for a multi-row field in the test case data.
 */
export interface FieldDirectiveInterface extends DirectiveBaseInterface {
  /**
   * The value provided in the "key" column.
   */
  key: string

  /**
   * The comment or annotation provided in the "comment" column.
   */
  comment: string

  /**
   * Additional information provided in the "other" column.
   */
  other: string
}

/**
 * Options used for creating a FieldDirective instance.
 */
export interface FieldDirectiveOptions extends DirectiveBaseOptions {
  /**
   * The value provided in the "key" column.
   */
  key: string

  /**
   * The comment or annotation provided in the "comment" column.
   */
  comment: string

  /**
   * Additional information provided in the "other" column.
   */
  other: string
}

/**
 * Implementation of a directive for field metadata values.
 *
 * This class extends the basic directive functionality and includes
 * properties for the "key", "comment", and "other" columns.
 */
export class FieldDirective extends DirectiveBase implements FieldDirectiveInterface {
  key: string
  comment: string
  other: string

  constructor(opts: FieldDirectiveOptions) {
    super(opts)
    this.key = opts.key
    this.comment = opts.comment
    this.other = opts.other
  }
}
