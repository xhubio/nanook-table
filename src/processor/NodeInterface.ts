import type {
  MetaTestcase,
  TestcaseDirectivesInterface,
  ReferenceDirectiveInterface
} from '../model/index.js'
import type { NodeGeneratorDirectiveInterface } from './NodeGeneratorDirectiveInterface.js'
import type { NodeFieldDirectiveInterface } from './NodeFieldDirectiveInterface.js'
import type { NodeReferenceDirectiveInterface } from './NodeReferenceDirectiveInterface.js'
import type { NodeStaticDirectiveInterface } from './NodeStaticDirectiveInterface.js'
import type { Reference } from './Reference.js'

/**
 * Groups directives by their type for a node.
 *
 * This type defines the structure for storing directives, grouped into:
 * - generator directives
 * - static directives
 * - reference directives
 * - field (meta) directives
 */
export type NodeDirectivesType = {
  /** Array of generator directives */
  generator: NodeGeneratorDirectiveInterface[]
  /** Array of static directives */
  static: NodeStaticDirectiveInterface[]
  /** Array of reference directives */
  reference: NodeReferenceDirectiveInterface[]
  /** Array of field (meta) directives */
  field: NodeFieldDirectiveInterface[]
}

/**
 * Options for constructing a Node instance.
 */
export interface NodeInterfaceOptions {
  /**
   * Meta information for the test case associated with this node.
   */
  testcaseMeta: MetaTestcase
  /**
   * An optional initial set of directives for the node.
   */
  directives?: NodeDirectivesType
  /**
   * Indicates if this test case should never be executed.
   * Such test cases only provide data for other test cases.
   */
  neverExecute?: boolean
  /**
   * An array of tags associated with this test case.
   */
  tags?: string[]
}

/**
 * Public interface for a Node in the data generation graph.
 *
 * A Node represents a single test case in the generation process.
 * It stores its own directives, references, and caching data for clones and instance IDs.
 * The interface defines properties and methods for managing these elements.
 */
export interface NodeInterface {
  /** A unique identifier for this node instance. */
  instanceId: string

  /** Optional instance identifier for references. */
  refInstanceId?: string

  /**
   * Stores the referenced nodes, keyed by their field name.
   * This mapping allows quick access to referenced nodes.
   */
  references: Record<string, Reference>

  /** Raw directives grouped by type. */
  directives: TestcaseDirectivesInterface

  /** Caches references by their instanceId. */
  refCache: Record<string, Reference>

  /** Caches generated instanceIds by instanceId suffix. */
  instanceIdCache: Record<string, string>

  /** Meta information for the test case associated with this node. */
  testcaseMeta: MetaTestcase

  /** Indicates whether this test case should never be executed. */
  neverExecute: boolean

  /** Array of tags associated with this test case, used for filtering. */
  tags: string[]

  /**
   * Gets the aggregated generator directives for this node.
   * @returns An array of NodeGeneratorDirectiveInterface items.
   */
  readonly generatorDirectives: NodeGeneratorDirectiveInterface[]

  /**
   * Gets the aggregated reference directives for this node.
   * @returns An array of NodeReferenceDirectiveInterface items.
   */
  readonly referenceDirectives: NodeReferenceDirectiveInterface[]

  /**
   * Gets the aggregated static directives for this node.
   * @returns An array of NodeStaticDirectiveInterface items.
   */
  readonly staticDirectives: NodeStaticDirectiveInterface[]

  /**
   * Gets the aggregated field (meta) directives for this node.
   * @returns An array of NodeFieldDirectiveInterface items.
   */
  readonly fieldDirectives: NodeFieldDirectiveInterface[]

  /**
   * Creates a unique instanceId for a reference.
   * @param referenceCmd - The reference command containing instanceIdSuffix and other details.
   * @returns A unique instanceId string for the reference.
   */
  createReferenceInstanceId(referenceCmd: ReferenceDirectiveInterface): string

  /**
   * Checks if the given reference command represents a self-reference.
   * @param referenceCmd - The reference command to check.
   * @returns True if it is a self-reference; otherwise, false.
   */
  isSelfReference(referenceCmd: ReferenceDirectiveInterface): boolean

  /**
   * Adds a reference to this node.
   * @param reference - The Reference object to add.
   */
  addReference(reference: Reference): void

  /**
   * Creates a clone of this node.
   * @param recursive - If true, clones referenced nodes recursively; otherwise, clones only this node.
   * @returns A cloned NodeInterface instance.
   */
  clone(recursive?: boolean): NodeInterface

  /**
   * Retrieves a clone for the specified node.
   * If the node has already been cloned for this parent, returns the cached clone.
   * Otherwise, clones the node, caches it, and returns the clone.
   * @param nodeToClone - The node to be cloned.
   * @returns The clone of the provided node.
   */
  getCloneFor(nodeToClone: NodeInterface): NodeInterface
}
