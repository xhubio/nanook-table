import { v4 as uuidv4 } from 'uuid'
import type {
  MetaTestcase,
  TestcaseDirectivesInterface,
  ReferenceDirectiveInterface
} from '../model/index.js'
import { ReferenceDirective } from '../model/index.js'
import type { NodeInterface, NodeDirectivesType } from './NodeInterface.js'
import { Reference } from './Reference.js'
import type { NodeGeneratorDirectiveInterface } from './NodeGeneratorDirectiveInterface.js'
import type { NodeReferenceDirectiveInterface } from './NodeReferenceDirectiveInterface.js'
import type { NodeStaticDirectiveInterface } from './NodeStaticDirectiveInterface.js'
import type { NodeFieldDirectiveInterface } from './NodeFieldDirectiveInterface.js'

/**
 * Options for initializing a Node.
 */
export interface NodeOptions {
  /**
   * Meta information for the test case associated with this node.
   */
  testcaseMeta: MetaTestcase

  /**
   * An optional initial set of directives for the node.
   */
  directives?: TestcaseDirectivesInterface

  /**
   * Indicates if this test case should never be executed.
   * Such test cases provide data only for other test cases.
   */
  neverExecute?: boolean

  /**
   * An array of tags associated with this test case.
   */
  tags?: string[]
}

/**
 * Represents a node in the data generation graph.
 *
 * When traversing the tables, a graph is built to represent the order in which data generation
 * should occur. This graph is composed of Node instances. Each Node stores its own directives,
 * references, and caching information for cloned nodes.
 */
export class Node implements NodeInterface {
  /**
   * Unique identifier for this node.
   */
  instanceId: string = uuidv4()

  /**
   * If this node is created by a reference, stores the instanceId suffix of that reference.
   */
  refInstanceId?: string

  /**
   * Meta information for the test case associated with this node.
   */
  testcaseMeta: MetaTestcase

  /**
   * Indicates whether this test case should never be executed.
   * Such test cases are only used to provide data for other test cases.
   */
  neverExecute: boolean = false

  /**
   * An array of tags associated with this node. Tags are used for filtering.
   */
  tags: string[] = []

  /**
   * Maps field names to references.
   * Each entry associates a field name with its corresponding Reference object.
   */
  references: Record<string, Reference> = {}

  /**
   * Stores all the directives for this node.
   */
  directives: TestcaseDirectivesInterface = {
    generator: [],
    static: [],
    reference: [],
    field: []
  }

  /**
   * Temporary storage for aggregated directives.
   * This is built by the buildDirectives method.
   */
  tmpDirectives?: NodeDirectivesType

  /**
   * Caches references by their instanceId.
   */
  refCache: Record<string, Reference> = {}

  /**
   * Caches cloned nodes by the original node's instanceId.
   */
  cloneRef: Record<string, NodeInterface> = {}

  /**
   * Caches generated instanceIds by instanceId suffix.
   */
  instanceIdCache: Record<string, string> = {}

  /**
   * Constructs a new Node instance.
   *
   * @param opts - Options for initializing the node, including test case meta information, directives, execution flag, and tags.
   */
  constructor(opts: NodeOptions) {
    this.instanceId = uuidv4()
    this.testcaseMeta = opts.testcaseMeta

    // Initialize the reference instance id as undefined.
    this.refInstanceId = undefined

    if (opts.directives !== undefined) {
      this.directives = opts.directives
    }

    if (opts.neverExecute !== undefined) {
      this.neverExecute = opts.neverExecute
    }

    if (opts.tags !== undefined) {
      this.tags = opts.tags
    }
  }

  /**
   * Gets the aggregated generator directives for this node.
   *
   * This method builds a local collection of directives by traversing this node's own directives
   * and any referenced nodes, then returns the generator-type directives.
   *
   * @returns An array of NodeGeneratorDirectiveInterface items.
   */
  get generatorDirectives(): NodeGeneratorDirectiveInterface[] {
    this.buildDirectives()
    if (this.tmpDirectives !== undefined) {
      return this.tmpDirectives.generator
    }
    return []
  }

  /**
   * Gets the aggregated reference directives for this node.
   *
   * @returns An array of NodeReferenceDirectiveInterface items.
   */
  get referenceDirectives(): NodeReferenceDirectiveInterface[] {
    this.buildDirectives()
    if (this.tmpDirectives !== undefined) {
      return this.tmpDirectives.reference
    }
    return []
  }

  /**
   * Gets the aggregated static directives for this node.
   *
   * @returns An array of NodeStaticDirectiveInterface items.
   */
  get staticDirectives(): NodeStaticDirectiveInterface[] {
    this.buildDirectives()
    if (this.tmpDirectives !== undefined) {
      return this.tmpDirectives.static
    }
    return []
  }

  /**
   * Gets the aggregated field directives for this node.
   *
   * @returns An array of NodeFieldDirectiveInterface items.
   */
  get fieldDirectives(): NodeFieldDirectiveInterface[] {
    this.buildDirectives()
    if (this.tmpDirectives !== undefined) {
      return this.tmpDirectives.field
    }
    return []
  }

  /**
   * Builds and caches a local collection of directives from this node and its references.
   *
   * This method initializes a temporary directives object and deep-copies the existing directives from this node.
   * It then traverses the node's references to aggregate additional directives.
   * The aggregated directives are stored in the tmpDirectives property.
   */
  private buildDirectives() {
    if (this.tmpDirectives === undefined) {
      this.tmpDirectives = {
        generator: [],
        static: [],
        reference: [],
        field: []
      }

      // Process generator directives.
      for (const directive of this.directives.generator) {
        const newDirective = JSON.parse(JSON.stringify(directive))
        newDirective.node = this
        this.tmpDirectives.generator.push(newDirective)
      }
      // Process static directives.
      for (const directive of this.directives.static) {
        const newDirective = JSON.parse(JSON.stringify(directive))
        newDirective.node = this
        this.tmpDirectives.static.push(newDirective)
      }
      // Process field directives.
      for (const directive of this.directives.field) {
        const newDirective = JSON.parse(JSON.stringify(directive))
        newDirective.node = this
        this.tmpDirectives.field.push(newDirective)
      }

      // Process reference directives by iterating over the references.
      for (const fieldName of Object.keys(this.references)) {
        const ref = this.references[fieldName]

        const referenceDirective = new ReferenceDirective({
          fieldName: ref.fieldName,
          instanceIdSuffix: ref.instanceIdSuffix,
          targetFieldName: ref.targetFieldName,
          targetTableName: ref.targetTableName,
          targetTestcaseName: ref.targetTestcaseName,
          testcaseMeta: {
            fileName: ref.tableMeta.fileName,
            tableName: ref.tableMeta.tableName,
            tableType: ref.tableType,
            testcaseName: ref.testcaseName
          }
        })

        const targetNode = ref.targetNode ?? this

        // Push the constructed reference directive.
        this.tmpDirectives.reference.push({
          targetNode,
          fieldName,
          instanceIdSuffix: referenceDirective.instanceIdSuffix,
          parentNode: ref.parentNode,
          targetFieldName: referenceDirective.targetFieldName,
          targetTableName: referenceDirective.targetTableName,
          targetTestcaseName: referenceDirective.targetTestcaseName,
          testcaseMeta: referenceDirective.testcaseMeta
        })

        if (!ref.selfReference) {
          // For non-self references, aggregate additional directives from the target node.
          const target = ref.targetNode
          if (target === undefined) {
            throw new Error(
              `A reference which is not a selfReference needs a targetNode '${ref.tableName}/${ref.fieldName}'`
            )
          }
          for (const directive of target.referenceDirectives) {
            directive.targetNode = this
            this.tmpDirectives.reference.push(directive)
          }
          for (const directive of target.generatorDirectives) {
            directive.node = target
            this.tmpDirectives.generator.push(directive)
          }
          for (const directive of target.staticDirectives) {
            directive.node = target
            this.tmpDirectives.static.push(directive)
          }
          for (const directive of target.fieldDirectives) {
            directive.node = target
            this.tmpDirectives.field.push(directive)
          }
        }
      }
    }
  }

  /**
   * Creates a unique instanceId for a reference directive.
   *
   * If the reference is a self-reference, it returns this node's instanceId.
   * Otherwise, if an instanceIdSuffix is provided and cached, it returns the cached value.
   * If not cached, it generates a new instanceId, caches it, and returns it.
   *
   * @param referenceCmd - The reference command containing instanceIdSuffix and other info.
   * @returns A unique instanceId for the reference.
   */
  createReferenceInstanceId(referenceCmd: ReferenceDirectiveInterface) {
    if (this.isSelfReference(referenceCmd)) {
      return this.instanceId
    }

    const idSuffix = referenceCmd.instanceIdSuffix

    if (idSuffix !== undefined && idSuffix !== '') {
      if (this.instanceIdCache[idSuffix] === undefined) {
        // No instanceId registered for this suffix; generate and cache a new one.
        this.instanceIdCache[idSuffix] = uuidv4()
      }
      return this.instanceIdCache[idSuffix]
    }

    // If no suffix is provided, generate a new instanceId.
    return uuidv4()
  }

  /**
   * Determines whether the given reference command represents a self-reference.
   *
   * A reference is considered self-referential if:
   * - The target test case name is undefined, empty, or equal to this node's test case name.
   * - The target table name is the same as this node's table name.
   * - No instanceIdSuffix is provided.
   *
   * @param referenceCmd - The reference command to evaluate.
   * @returns True if the reference is a self-reference; otherwise, false.
   */
  isSelfReference(referenceCmd: ReferenceDirectiveInterface) {
    if (
      (referenceCmd.targetTestcaseName === undefined ||
        referenceCmd.targetTestcaseName === '' ||
        referenceCmd.targetTestcaseName === this.testcaseMeta.testcaseName) &&
      referenceCmd.targetTableName === this.testcaseMeta.tableName &&
      (referenceCmd.instanceIdSuffix === undefined ||
        referenceCmd.instanceIdSuffix === '')
    ) {
      return true
    }
    return false
  }

  /**
   * Adds a reference to this node.
   *
   * The reference is stored in the node's references mapping using its field name.
   * If the reference is a self-reference, its targetNode is set to this node.
   * For non-self references, if the node already exists in the cache, that node is used;
   * otherwise, the reference is cached.
   *
   * @param reference - The Reference object to add.
   */
  addReference(reference: Reference) {
    const fieldName = reference.fieldName
    this.references[fieldName] = reference
    reference.parentNode = this

    if (reference.selfReference) {
      reference.targetNode = this
    } else if (this.refCache[reference.instanceId] === undefined) {
      this.refCache[reference.instanceId] = reference
    } else {
      const otherRef = this.refCache[reference.instanceId]
      reference.targetNode = otherRef.targetNode
    }
  }

  /**
   * Creates a clone of this node.
   *
   * If recursive cloning is enabled, the method clones all referenced nodes as well.
   * The cloned node's reference directives are cleared.
   *
   * @param recursive - If true, clones referenced nodes recursively; otherwise, only clones this node.
   * @returns A cloned Node instance.
   */
  clone(recursive = false) {
    const newNode = new Node({
      testcaseMeta: this.testcaseMeta,
      neverExecute: this.neverExecute,
      tags: this.tags,
      directives: JSON.parse(JSON.stringify(this.directives))
    })

    // Do not clone reference commands.
    newNode.directives.reference = []

    if (recursive) {
      for (const fieldName of Object.keys(this.references)) {
        const ref = this.references[fieldName]
        let newRef
        if (ref.selfReference) {
          newRef = ref.clone(false)
        } else {
          newRef = ref.clone(true)
        }
        newNode.addReference(newRef)
      }
    }

    return newNode
  }

  /**
   * Retrieves a cloned node for the given node.
   *
   * If the node has already been cloned for this parent, returns the cached clone.
   * Otherwise, clones the node and caches it before returning.
   *
   * @param nodeToClone - The node to clone.
   * @returns A cloned NodeInterface instance.
   */
  getCloneFor(nodeToClone: NodeInterface) {
    const origInstanceId = nodeToClone.instanceId
    let clonedNode
    if (this.cloneRef[origInstanceId] === undefined) {
      clonedNode = nodeToClone.clone()
      this.cloneRef[origInstanceId] = clonedNode
    } else {
      clonedNode = this.cloneRef[origInstanceId]
    }
    return clonedNode
  }
}
