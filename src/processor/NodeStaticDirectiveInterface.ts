import type { StaticDirectiveInterface } from '../model/index.js'
import type { NodeInterface } from './NodeInterface.js'

/**
 * Defines the directive for static values
 */
export interface NodeStaticDirectiveInterface
  extends StaticDirectiveInterface {
  /** The node this directive is generated from */
  node: NodeInterface
}
