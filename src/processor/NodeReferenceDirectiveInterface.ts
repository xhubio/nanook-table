import type { ReferenceDirectiveInterface } from '../model/index.js'
import type { NodeInterface } from './NodeInterface.js'

/**
 * Defines the directive for a reference. A reference points
 * to a test case in a different table.
 */
export interface NodeReferenceDirectiveInterface extends ReferenceDirectiveInterface {
  /** The node this directive is generated from */
  targetNode: NodeInterface

  parentNode: NodeInterface
}
