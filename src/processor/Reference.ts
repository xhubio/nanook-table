import type { MetaTable, TableInterface } from '../model/index.js'
import { v4 as uuidv4 } from 'uuid'
import type { NodeInterface } from './NodeInterface.js'
import type { DataGeneratorRegistry } from '../data-generator/index.js'

/**
 * Options for initializing a Reference.
 */
export interface ReferenceOptions {
  /**
   * The instanceId of the current test case.
   */
  instanceId?: string

  /**
   * Indicates whether this Reference is a self-reference.
   */
  selfReference?: boolean

  /**
   * An array of all available tables.
   */
  tables: TableInterface[]

  /**
   * The parent node of this Reference.
   */
  parentNode: NodeInterface

  /**
   * The suffix for the test case instance id of this Reference.
   */
  instanceIdSuffix: string

  /**
   * The name of the current table.
   */
  tableName: string

  /**
   * The name of the target table.
   */
  targetTableName: string

  /**
   * The type of the current table.
   */
  tableType: string

  /**
   * The type of the target table.
   */
  targetTableType: string

  /**
   * The name of the current test case.
   */
  testcaseName: string

  /**
   * The name of the target test case.
   */
  targetTestcaseName: string

  /**
   * The field name where the reference is defined.
   */
  fieldName: string

  /**
   * The field name that the reference points to.
   */
  targetFieldName: string

  /**
   * The meta information of the table.
   */
  tableMeta: MetaTable

  /**
   * The data generator registry.
   */
  generatorRegistry: DataGeneratorRegistry
}

/**
 * Represents a reference between test cases in different tables.
 *
 * A Reference is used in data generation to link a test case to a target test case,
 * enabling the reuse of generated data. It stores identifiers and meta information
 * that help in determining whether two references point to the same target.
 */
export class Reference {
  /**
   * A unique identifier for this Reference.
   */
  id: string = uuidv4()

  /**
   * The instanceId of the current test case. Defaults to a new UUID if not provided.
   */
  instanceId: string = uuidv4()

  /**
   * Indicates whether this Reference is a self-reference.
   */
  selfReference: boolean = false

  /**
   * Flag used to indicate if this Reference points to the same target as another reference.
   */
  isSameReffalse = false

  /**
   * An array of all available tables.
   */
  tables: TableInterface[]

  /**
   * The parent node that owns this Reference.
   */
  parentNode: NodeInterface

  /**
   * The target node that this Reference points to (if any).
   */
  targetNode?: NodeInterface

  /**
   * The suffix for the test case instance id of this Reference.
   */
  instanceIdSuffix: string

  /**
   * The name of the current table.
   */
  tableName: string

  /**
   * The name of the target table.
   */
  targetTableName: string

  /**
   * The type of the current table.
   */
  tableType: string

  /**
   * The type of the target table.
   */
  targetTableType: string

  /**
   * The name of the current test case.
   */
  testcaseName: string

  /**
   * The name of the target test case.
   */
  targetTestcaseName: string

  /**
   * The field name where the reference is defined.
   */
  fieldName: string

  /**
   * The field name that the reference points to.
   */
  targetFieldName: string

  /**
   * Meta information for the table.
   */
  tableMeta: MetaTable

  /**
   * The data generator registry.
   */
  generatorRegistry: DataGeneratorRegistry

  /**
   * Constructs a new Reference instance.
   *
   * @param opts - Options for initializing the Reference, including meta information,
   *               instance identifiers, table and test case names, field names, and generator registry.
   */
  constructor(opts: ReferenceOptions) {
    this.tables = opts.tables
    this.parentNode = opts.parentNode
    this.instanceIdSuffix = opts.instanceIdSuffix
    this.tableName = opts.tableName
    this.targetTableName = opts.targetTableName
    this.tableType = opts.tableType
    this.targetTableType = opts.targetTableType
    this.testcaseName = opts.testcaseName
    this.targetTestcaseName = opts.targetTestcaseName
    this.fieldName = opts.fieldName
    this.targetFieldName = opts.targetFieldName
    this.tableMeta = opts.tableMeta
    this.generatorRegistry = opts.generatorRegistry

    if (opts.instanceId !== undefined) {
      this.instanceId = opts.instanceId
    }

    if (opts.selfReference !== undefined) {
      this.selfReference = opts.selfReference
    }
  }

  /**
   * Computes the target identity string for this Reference.
   *
   * The target identity uniquely identifies the target test case by combining
   * the target table name, target test case name, and the instanceIdSuffix.
   *
   * @returns A string representing the target identity.
   */
  get targetIdentity(): string {
    const suffix = this.instanceIdSuffix || '__DEFAULT__'
    return `${this.targetTableName}-${this.targetTestcaseName}-${suffix}`
  }

  /**
   * Clones the current Reference.
   *
   * If recursive cloning is enabled, the method also clones the target node recursively.
   *
   * @param recursiv - If true, clones the target node recursively; otherwise, clones only this Reference.
   * @returns A new Reference instance that is a clone of the current one.
   */
  clone(recursiv = false): Reference {
    const newRef = new Reference({
      ...this,
      parent: undefined, // Exclude parent from clone options.
      target: undefined, // Exclude target from clone options.
      isSameRef: false // Reset isSameRef flag for the clone.
    })

    if (recursiv) {
      if (this.targetNode !== undefined) {
        const newTarget = this.targetNode.clone(recursiv)
        newRef.targetNode = newTarget
      }
    }

    return newRef
  }
}
