import type { FieldDirectiveInterface } from '../model/index.js'
import type { NodeInterface } from './NodeInterface.js'

/** Defines the common data for all the directives. */
export interface NodeFieldDirectiveInterface extends FieldDirectiveInterface {
  /** The node this directive is generated from */
  node: NodeInterface
}
