import { DirectiveBase } from './DirectiveBase.js'
import type {
  DirectiveBaseInterface,
  DirectiveBaseOptions
} from './DirectiveBase.js'

/**
 * Represents a directive for a reference.
 *
 * A reference directive points to a test case in a different table.
 * It includes details such as the target table, field, and test case,
 * as well as an instance ID suffix to distinguish multiple references.
 */
export interface ReferenceDirectiveInterface extends DirectiveBaseInterface {
  /**
   * The name of the target table to which this reference points.
   */
  targetTableName: string

  /**
   * The name of the target field in the referenced table.
   */
  targetFieldName: string

  /**
   * The name of the target test case in the referenced table.
   */
  targetTestcaseName: string

  /**
   * The instance ID suffix used to uniquely identify this reference.
   */
  instanceIdSuffix: string
}

/**
 * Options for creating a ReferenceDirective instance.
 */
export interface ReferenceDirectiveOptions extends DirectiveBaseOptions {
  targetTableName: string
  targetFieldName: string
  targetTestcaseName: string
  instanceIdSuffix: string
}

/**
 * Implementation of a directive for a reference.
 */
export class ReferenceDirective
  extends DirectiveBase
  implements ReferenceDirectiveInterface
{
  targetTableName: string
  targetFieldName: string
  targetTestcaseName: string
  instanceIdSuffix: string

  constructor(opts: ReferenceDirectiveOptions) {
    super(opts)
    this.targetTableName = opts.targetTableName
    this.targetFieldName = opts.targetFieldName
    this.targetTestcaseName = opts.targetTestcaseName
    this.instanceIdSuffix = opts.instanceIdSuffix
  }
}
