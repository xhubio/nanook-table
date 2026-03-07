import type { GeneratorDirectiveInterface } from '../model/index.js'
import type { NodeInterface } from './NodeInterface.js'

/**
 * Defines the directive for calling a generator.
 * When processing a table all the generator calls are collected
 * in a list of directives.
 * Then the list of directives will be executed until each generator has generated
 * its data.
 */
export interface NodeGeneratorDirectiveInterface extends GeneratorDirectiveInterface {
  /** The node this directive is generated from */
  node: NodeInterface
}
