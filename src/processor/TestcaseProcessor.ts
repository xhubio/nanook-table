import { v4 as uuidv4 } from 'uuid'
import clone from 'clone'
import { Node } from './Node.js'
import { TestcaseData } from './TestcaseData.js'
import type { InterfaceProcessor } from './InterfaceProcessor.js'
import { Reference } from './Reference.js'
import { cartesianProduct } from './utilCartesian.js'
import { writeFieldData } from './writeFieldData.js'
import { writeStaticData } from './writeStaticData.js'
import type { TestcaseDataInterface } from './TestcaseDataInterface.js'
import type { NodeStaticDirectiveInterface } from './NodeStaticDirectiveInterface.js'
import type { FilterProcessorInterface } from './filter/FilterProcessorInterface.js'
import { LoggerMemory } from '../logger/index.js'
import type { LoggerInterface } from '../logger/index.js'
import type { DataGeneratorRegistry } from '../data-generator/index.js'
import type { InterfaceWriter } from './InterfaceWriter.js'
import type {
  TableInterface,
  TestcaseDefinitionInterface
} from '../model/index.js'
import type { CallTreeInterface } from './CallTreeInterface.js'
import type { NodeInterface } from './NodeInterface.js'
import type { NodeGeneratorDirectiveInterface } from './NodeGeneratorDirectiveInterface.js'
import type { NodeReferenceDirectiveInterface } from './NodeReferenceDirectiveInterface.js'
import type { NodeFieldDirectiveInterface } from './NodeFieldDirectiveInterface.js'

export type DataWriterFunctionStatic = (
  testcaseData: TestcaseDataInterface,
  directives: NodeStaticDirectiveInterface[]
) => void

export type DataWriterFunctionField = (
  testcaseData: TestcaseDataInterface,
  directives: NodeFieldDirectiveInterface[]
) => void

export interface TestcaseProcessorOptions {
  /** All the writer used to write the data of the test cases */
  writer: InterfaceWriter[]

  /** The registry containing all the data generators */
  generatorRegistry: DataGeneratorRegistry

  /** The logger to use */
  logger?: LoggerInterface

  /** A function to transfer the data from a directive into the TestcaseData object */
  writeMetaData?: DataWriterFunctionField

  /** A function to transfer the data from a directive into the TestcaseData object */
  writeStaticData?: DataWriterFunctionStatic

  /** Stores all the tables by there name */
  tables: Record<string, TableInterface>
}

export class TestcaseProcessor implements InterfaceProcessor {
  /** A function to transfer the data from a directive into the TestcaseData object */
  writeMetaData: DataWriterFunctionField = writeFieldData

  /** A function to transfer the data from a directive into the TestcaseData object */
  writeStaticData: DataWriterFunctionStatic = writeStaticData

  logger: LoggerInterface

  /** Stores all the filter processors by there name */
  filterProcessor = new Map<string, FilterProcessorInterface>()

  /** The registry containing all the data generators */
  generatorRegistry: DataGeneratorRegistry

  /** Stores all the tables by there name */
  tables: Record<string, TableInterface> = {}

  /** All the writer used to write the data of the test cases */
  writer: InterfaceWriter[]

  constructor(opts: TestcaseProcessorOptions) {
    if (opts.writeMetaData) {
      this.writeMetaData = opts.writeMetaData
    }
    if (opts.writeStaticData) {
      this.writeStaticData = opts.writeStaticData
    }

    this.logger = opts.logger ?? new LoggerMemory()
    this.generatorRegistry = opts.generatorRegistry
    this.writer = opts.writer
  }

  /**
   * Adds all the given tables to the processor.
   * @param tables - A list of tables
   */
  addTables(tables: TableInterface | TableInterface[]) {
    let tmpTabels: TableInterface | TableInterface[] = tables

    if (!Array.isArray(tmpTabels)) {
      tmpTabels = [tables as TableInterface]
    }

    if (Array.isArray(tmpTabels)) {
      for (const table of tmpTabels) {
        if (this.tables[table.tableName] !== undefined) {
          this.logger.error({
            function: 'addTables',
            message: `The table name '${table.tableName}' is double. The last table overwrites the previous one`
          })
        }
        this.tables[table.tableName] = table
      }
    }
  }

  /**
   * Deletes the loaded tables
   * and also the data of the generators
   */
  clear() {
    this.tables = {}
  }

  /**
   * Adds a new filterProcessor to the processor
   * @param filterProcessor - A filterProcessor object
   */
  addFilterProcessor(filterProcessor: FilterProcessorInterface): void {
    const name = filterProcessor.name
    if (this.filterProcessor.has(name)) {
      this.logger.error(
        `There is already a filterProcessor registered with the name '${name}'`
      )
    }
    this.filterProcessor.set(name, filterProcessor)
  }

  /**
   * Returns a filterProcessor with the given name
   * @param name - The name of this filterProcessor
   * @returns The filterProcessor with the given name or undefined if the processor does not exists
   */
  getFilterProcessor(name: string): FilterProcessorInterface | undefined {
    if (!this.filterProcessor.has(name)) {
      this.logger.error(
        `A filterProcessor with the name '${name}' does not exists. Filter is ignored`
      )
    }
    return this.filterProcessor.get(name)
  }

  async process() {
    if (this.generatorRegistry.loadStore !== undefined) {
      await this.generatorRegistry.loadStore()
    }

    for (const writer of this.writer) {
      await writer.before()
    }

    try {
      // just iterate all the tables
      for (const tableName of Object.keys(this.tables)) {
        this.logger.info(`Work on table '${tableName}'`)
        const table = this.tables[tableName]
        table.logger = this.logger

        await this.processTable(table)
      }
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error({
          message: err.message,
          function: 'process',
          stack: err.stack
        })
      } else {
        this.logger.error({
          message: err,
          function: 'process'
        })
      }
    }

    for (const writer of this.writer) {
      await writer.after()
    }

    if (this.generatorRegistry.loadStore !== undefined) {
      await this.generatorRegistry.saveStore()
    }
  }

  /**
   * Processes a single table
   * @param table - The table object to be executed
   */
  async processTable(table: TableInterface) {
    const gen = table.getTestcasesForExecution()
    try {
      let obj = gen.next()
      do {
        if (obj.value !== undefined) {
          const testcaseDefinition = obj.value
          testcaseDefinition.logger = this.logger

          this.logger.info(
            `\tWork on test case '${testcaseDefinition.testcaseMeta.testcaseName}'`
          )
          try {
            const testcaseDataList =
              await this.processTestcase(testcaseDefinition)
            this.logger.info(`\t\tTest case count '${testcaseDataList.length}'`)

            for (const tcData of testcaseDataList) {
              await this.postProcessGenerators(tcData)
              tcData.postProcessDirectives = []

              for (const writer of this.writer) {
                await writer.write(clone(tcData))
              }
            }
          } catch (err) {
            if (err instanceof Error) {
              this.logger.error({
                message: err.message,
                function: 'processTable',
                stack: err.stack,
                tableName: table.tableName,
                testName: testcaseDefinition.testcaseMeta.testcaseName
              })
            } else {
              this.logger.error({
                message: err,
                function: 'processTable',
                tableName: table.tableName,
                testName: testcaseDefinition.testcaseMeta.testcaseName
              })
            }
          }
        }
        obj = gen.next()
      } while (!obj.done)
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error({
          message: err.message,
          function: 'processTable',
          stack: err.stack,
          tableName: table.tableName
        })
      } else {
        this.logger.error({
          message: err,
          function: 'processTable',
          tableName: table.tableName
        })
      }
    }
  }

  /**
   * Calls the generator for post processing
   * @param testcaseData - The testcaseData object wich stores all the information of this testcase
   * @returns True if the directive is fullfilled
   */
  async postProcessGenerators(testcaseData: TestcaseDataInterface) {
    const directives = testcaseData.postProcessDirectives

    // First the directives need to be ordered
    for (const directive of directives) {
      if (directive.order === undefined) {
        directive.order = 1000
      }
    }

    directives.sort((a, b) => {
      return a.order - b.order
    })

    // Now execute the directives in their order
    for (const directive of directives) {
      const instanceId = directive.instanceIdSuffix
        ? `${testcaseData.instanceId}:${directive.instanceIdSuffix}`
        : testcaseData.instanceId

      const generator = this.generatorRegistry.getGenerator(
        directive.generatorName
      )

      await generator.postProcess({
        instanceId,
        testcaseData,
        generatorDirective: directive
      })
    }

    testcaseData.postProcessDirectives = []
  }

  /**
   * Processes a single testcase of a table. This method is called
   * from the TableProcessor. This is the entry point for a single testcase.
   * @param testcaseDefinition - The Testcase definition to be executed
   * @returns An array TestcaseData Objects
   */
  async processTestcase(testcaseDefinition: TestcaseDefinitionInterface) {
    const rootNodeList = await this.createNodeTree(testcaseDefinition)
    const tcList = []

    // A list of generator names to be skipped for this test case
    const generatorSwitches = testcaseDefinition.createGeneratorSwitches()

    for (let i = 0; i < rootNodeList.length; i++) {
      const node = rootNodeList[i]

      // Hat eine referenzierte Node ein neverExecute=true ?

      if (rootNodeList.length > 1) {
        // In this case we need to add a modifier to the test case name
        node.testcaseMeta.testcaseName = `${testcaseDefinition.testcaseMeta.testcaseName}-${i + 1}`
      }

      const callTree = this.buildCallTree(node)

      if (
        !this.isNeverExecute(callTree) &&
        this.isFilterOk({ testcaseDefinition, callTree })
      ) {
        this.recreateInstanceIds(node)
        const tcData = new TestcaseData({
          tableName: node.testcaseMeta.tableName,
          name: node.testcaseMeta.testcaseName,
          instanceId: node.instanceId,
          callTree
        })

        await this.generateData(tcData, node, generatorSwitches)
        tcList.push(tcData)
      }
    }

    return tcList
  }

  /**
   * Returns false if this test case has a filter and the test case does not
   * match the filter criteria
   * @param testcaseDefinition - The Testcase definition to be executed
   * @param callTree - The RootObject of the callTree
   * @returns An array TestcaseData Objects
   */
  private isFilterOk(request: {
    callTree: CallTreeInterface
    testcaseDefinition: TestcaseDefinitionInterface
  }) {
    const { callTree, testcaseDefinition } = request

    const allTags = this.getTags(callTree)
    const allFilter = testcaseDefinition.createFilter()

    let isFilterOk = true

    // No Filter, no problems
    if (allFilter.length > 0 && allTags.length > 0) {
      // If more then one filter is defined, the filter are AND connected
      for (const filterDef of allFilter) {
        const filterProcessorName = filterDef.filterProcessorName
        const expression = filterDef.expression

        const filterProcessor = this.getFilterProcessor(filterProcessorName)
        if (filterProcessor !== undefined) {
          if (!filterProcessor.filter(allTags, expression)) {
            isFilterOk = false
            break
          }
        }
      }
    }

    return isFilterOk
  }

  /**
   * Iterates through the call tree and checks if there is an element with neverExceute=true
   * @param callTree - The RootObject of the callTree
   * @returns True, if one child object has neverExecute=true
   */
  private isNeverExecute(callTree: CallTreeInterface) {
    function iterate(rootObj: CallTreeInterface) {
      if (rootObj.neverExecute) {
        return true
      }

      for (const obj of rootObj.children) {
        if (obj.neverExecute) {
          return true
        }
        if (iterate(obj)) {
          return true
        }
      }
      return false
    }

    if (iterate(callTree)) {
      return true
    }

    return false
  }

  /**
   * Get all the tags of all the nodes in one array back.
   * @param callTree - Das RootObject des callTrees
   * @returns An array with all the tags
   */
  private getTags(callTree: CallTreeInterface): string[] {
    const tags: string[] = []
    function iterate(rootObj: CallTreeInterface) {
      rootObj.tags.forEach((tag) => {
        tags.push(tag)
      })

      for (const obj of rootObj.children) {
        iterate(obj)
      }
    }

    iterate(callTree)
    return tags
  }

  /**
   * Builds the call tree for this test case data object.
   * This tree could be used to create the test case names
   * or what ever you need
   * @param node - The parent node
   * @returns The created callTree object
   */
  private buildCallTree(node: NodeInterface): CallTreeInterface {
    const children: CallTreeInterface[] = []

    // now follow the references
    for (const fieldName of Object.keys(node.references)) {
      const ref = node.references[fieldName]
      if (!ref.selfReference) {
        if (ref.targetNode === undefined) {
          throw new Error(`The reference '' has no target node`)
        }
        const childNode = this.buildCallTree(ref.targetNode)
        children.push(childNode)
      }
    }

    return {
      instanceId: node.instanceId,
      tableName: node.testcaseMeta.tableName,
      testcaseName: node.testcaseMeta.testcaseName,
      neverExecute: node.neverExecute,
      tags: node.tags,
      children
    }
  }

  /**
   * Generates the test case data for a node.
   * Also calls recursively all the referenced nodes for data
   * creation. The created data is stored in the given testcaseData
   * object.
   * @param testcaseData - The testcase data object for storing the data
   * @param node - The node to create the data for
   * @param generatorSwitches - A list of generator names to be skipped
   */
  private async generateData(
    testcaseData: TestcaseData,
    node: NodeInterface,
    generatorSwitches: string[]
  ) {
    const staticDirectives = node.staticDirectives
    const fieldDirectives = node.fieldDirectives
    let referenceDirectives = node.referenceDirectives

    // filter for generators which are switched off
    let generatorDirectives = node.generatorDirectives.filter(
      (genDirective) => !generatorSwitches.includes(genDirective.generatorName)
    )

    this.writeStaticData(testcaseData, staticDirectives)
    this.writeMetaData(testcaseData, fieldDirectives)

    let changeCount = 0
    do {
      changeCount = 0

      const { changeCount: changeCountGenerator, openGeneratorDirectives } =
        await this.executeGeneratorDirectives(testcaseData, generatorDirectives)
      changeCount += changeCountGenerator

      const { changeCount: changeCountReference, openReferenceDirectives } =
        this.executeReferenceDirectives(testcaseData, referenceDirectives)
      changeCount += changeCountReference

      referenceDirectives = openReferenceDirectives
      generatorDirectives = openGeneratorDirectives
    } while (
      (generatorDirectives.length > 0 || referenceDirectives.length > 0) &&
      changeCount > 0
    )

    if (generatorDirectives.length > 0 || referenceDirectives.length > 0) {
      const header = `tableName -> testcaseName -> fieldName -> (generatorName)`
      const data = []
      for (const directive of generatorDirectives) {
        data.push(
          `Generator: ${directive.testcaseMeta.tableName} -> ${directive.testcaseMeta.testcaseName} -> ${directive.fieldName} -> ${directive.generatorName}`
        )
      }
      for (const directive of referenceDirectives) {
        data.push(
          `Reference: ${directive.testcaseMeta.tableName} -> ${directive.testcaseMeta.testcaseName} -> ${directive.fieldName}`
        )
      }

      this.logger.error({
        header,
        message: `Could not resolve all the fields`,
        details: data.join('\n')
      })
    }
  }

  /**
   * Calls the generator and stores the data in the data object.
   * Important: When calling a generator with an instanceId suffix then
   * this is only for the generator. The data will be stored using the
   * instanceId of the node.
   * @param testcaseData - The testcase data object for storing the data
   * @param generatorDirectives - An array of generator directives
   * @returns The number of succesful generator calls and the still open directives
   */
  private async executeGeneratorDirectives(
    testcaseData: TestcaseData,
    generatorDirectives: NodeGeneratorDirectiveInterface[]
  ): Promise<{
    changeCount: number
    openGeneratorDirectives: NodeGeneratorDirectiveInterface[]
  }> {
    let changeCount = 0

    // Stores the generator directives which were not solved in this call
    const openGeneratorDirectives: NodeGeneratorDirectiveInterface[] = []

    for (let i = 0; i < generatorDirectives.length; i++) {
      const directive = generatorDirectives[i]
      const instanceId = directive.node.instanceId

      const generator = this.generatorRegistry.getGenerator(
        directive.generatorName
      )

      // the instance id used for the generator
      const genInstanceId = directive.instanceIdSuffix
        ? `${directive.node.instanceId} : ${directive.instanceIdSuffix}`
        : directive.node.instanceId

      let data
      try {
        data = await generator.generate({
          instanceId: genInstanceId,
          testcaseData,
          generatorDirective: directive
        })
      } catch (e) {
        if (e instanceof Error) {
          this.logger.error({
            message: e.message,
            testcaseMeta: directive.testcaseMeta,
            stack: e.stack
          })
        } else {
          this.logger.error({
            message: e,
            testcaseMeta: directive.testcaseMeta
          })
        }
        throw e
      }

      if (data !== undefined) {
        changeCount++

        // the instanceId to store the data is the instanceId of the TestcaseData
        // object.

        const tableName = directive.testcaseMeta.tableName
        const fieldName = directive.fieldName

        if (testcaseData.data[tableName] === undefined) {
          testcaseData.data[tableName] = {}
        }
        if (testcaseData.data[tableName][instanceId] === undefined) {
          testcaseData.data[tableName][instanceId] = {}
        }

        testcaseData.data[tableName][instanceId][fieldName] = data

        let postProcessDirectives
        try {
          postProcessDirectives = await generator.createPostProcessDirectives({
            instanceId,
            testcaseData,
            generatorDirective: directive
          })
        } catch (e) {
          if (e instanceof Error) {
            this.logger.error({
              message: e.message,
              testcaseMeta: directive.testcaseMeta,
              stack: e.stack
            })
          } else {
            this.logger.error({
              message: e,
              testcaseMeta: directive.testcaseMeta
            })
          }
          throw e
        }

        if (postProcessDirectives !== undefined) {
          for (const postProcessDirective of postProcessDirectives) {
            // The directive for postprocessing will only be stored if data was created
            testcaseData.postProcessDirectives.push(postProcessDirective)
          }
        }
      } else {
        // this was not yet solved
        openGeneratorDirectives.push(generatorDirectives[i])
      }
    }

    return { changeCount, openGeneratorDirectives }
  }

  /**
   *
   * @param testcaseData - The testcase data object for storing the data
   * @param referenceDirectives - An array of reference directives
   * @returns The number of succesful reference calls and the still open directives
   */
  private executeReferenceDirectives(
    testcaseData: TestcaseData,
    referenceDirectives: NodeReferenceDirectiveInterface[]
  ): {
    changeCount: number
    openReferenceDirectives: NodeReferenceDirectiveInterface[]
  } {
    let changeCount = 0

    // Stores the reference directives which were not solved in this call
    const openReferenceDirectives: NodeReferenceDirectiveInterface[] = []

    for (let i = 0; i < referenceDirectives.length; i++) {
      const nodeReferenceDirective = referenceDirectives[i]
      const targetTableName = nodeReferenceDirective.targetTableName
      const targetFieldName = nodeReferenceDirective.targetFieldName

      if (targetFieldName === undefined || targetFieldName === '') {
        // If no fieldName is given this reference will be resolved
        // on the first call. These kind of references are usefull to
        // let the generators in these testcases do the work
        changeCount++
      } else {
        const refInstanceId = nodeReferenceDirective.targetNode.instanceId

        // The instance is checked as well, not only the table. A referenced
        // table may already exist while the instance holding the field has not
        // been generated yet. In that case the directive belongs into
        // 'openReferenceDirectives' to be retried, which is what the else
        // branch below does. Without the instance check this threw
        // 'Cannot read properties of undefined'.
        if (
          testcaseData.data[targetTableName]?.[refInstanceId]?.[
            targetFieldName
          ] !== undefined
        ) {
          changeCount++

          // ok, the data was created
          const parentTableName = nodeReferenceDirective.testcaseMeta.tableName
          const parentFieldName = nodeReferenceDirective.fieldName
          const parentNode = nodeReferenceDirective.parentNode
          const instanceId = parentNode.instanceId

          const data =
            testcaseData.data[targetTableName][refInstanceId][targetFieldName]

          if (testcaseData.data[parentTableName] === undefined) {
            testcaseData.data[parentTableName] = {}
          }
          if (testcaseData.data[parentTableName][instanceId] === undefined) {
            testcaseData.data[parentTableName][instanceId] = {}
          }

          testcaseData.data[parentTableName][instanceId][parentFieldName] = data
        } else {
          openReferenceDirectives.push(referenceDirectives[i])
        }
      }
    }

    return { changeCount, openReferenceDirectives }
  }

  /**
   * This method creates the node trees for one testcaseDefinition
   * @param testcaseDefinition - The Testcase definition to be executed
   * @returns The new nodes created
   */
  async createNodeTree(
    testcaseDefinition: TestcaseDefinitionInterface
  ): Promise<NodeInterface[]> {
    const directives = testcaseDefinition.createDirectives()

    const tags = testcaseDefinition.createTags()

    // This is a root node.
    const node = new Node({
      directives,
      testcaseMeta: testcaseDefinition.testcaseMeta,
      tags
    })

    const nodeList = await this.explodeNodeReferences(node)
    return nodeList
  }

  /**
   * If the nodes are exploded we have copied instanceIDs.
   * So we need to recreate the instanceIds for all the rootNodes
   * to make sure they are unique
   * @param node - The node object to change the instanceIds
   * @param idMap - An object containing the newly mapped Ids. (Empty for the root node)
   * @param done - A set containing all the already translated IDs
   */
  private recreateInstanceIds(
    nodeOrReference: NodeInterface | Reference,
    idMap: Record<string, string> = {},
    done: Set<string> = new Set<string>()
  ) {
    function setObjectInstanceId(obj: NodeInterface | Reference) {
      if (done.has(obj.instanceId)) {
        // nothing to do, this id is a new one
        return
      }
      if (idMap[obj.instanceId] === undefined) {
        const newInstId = uuidv4()
        done.add(newInstId)
        idMap[obj.instanceId] = newInstId
        obj.instanceId = newInstId
      } else {
        const newInstId = idMap[obj.instanceId]
        obj.instanceId = newInstId
      }
    }

    setObjectInstanceId(nodeOrReference)

    if (nodeOrReference instanceof Node) {
      // now follow the references
      for (const fieldName of Object.keys(nodeOrReference.references)) {
        const reference = nodeOrReference.references[fieldName]
        setObjectInstanceId(reference)
        if (!reference.selfReference) {
          this.recreateInstanceIds(reference, idMap, done)
        }
      }
    }
  }

  /**
   * Traverses the references of this node. Just update the node with the references
   * @param node - The raw node with the unexpanded references
   * @returns An Array with the nodes created by the references
   */
  private async explodeNodeReferences(node: NodeInterface) {
    if (node.directives.reference.length === 0) {
      // if there are no references we just return the node as an array
      return [node]
    }

    const selfReferences: Reference[] = []
    const referenceIdsForCartesian: string[][] = []
    const nodeList: NodeInterface[] = []

    // used to check if there are references pointing to the same node
    const referenceSet = new Set()

    // stores all the references by there ID
    const referenceMap: Record<string, Reference> = {}

    for (const referenceCmd of node.directives.reference) {
      const targetTestcaseName = referenceCmd.targetTestcaseName
      const targetTableName =
        referenceCmd.targetTableName || node.testcaseMeta.tableName
      const targetTable = this.tables[targetTableName]
      if (targetTable === undefined) {
        // This table does not exists

        this.logger.error({
          tableName: node.testcaseMeta.tableName,
          testcaseName: node.testcaseMeta.testcaseName,
          message: `The targetTable '${targetTableName}' does not exists`
        })
      } else {
        const testcaseNames = targetTable.processRanges(targetTestcaseName)

        const fieldReferenceIds = []

        for (const tcName of testcaseNames) {
          const reference = new Reference({
            tableMeta: referenceCmd.testcaseMeta,
            fieldName: referenceCmd.fieldName,
            generatorRegistry: this.generatorRegistry,
            instanceIdSuffix: referenceCmd.instanceIdSuffix,
            parentNode: node,
            tables: Object.values(this.tables),
            targetFieldName: referenceCmd.targetFieldName,
            targetTableName: referenceCmd.targetTableName,
            targetTableType: targetTable.tableType,
            targetTestcaseName: referenceCmd.targetTestcaseName,
            testcaseName: referenceCmd.testcaseMeta.testcaseName,
            tableName: referenceCmd.testcaseMeta.tableName,
            tableType: referenceCmd.testcaseMeta.tableType
          })

          if (targetTestcaseName !== tcName) {
            // this is a range
            // if there is a range the instanceIdSuffix does not work. so it must not be defined
            if (
              referenceCmd.instanceIdSuffix !== undefined &&
              referenceCmd.instanceIdSuffix !== ''
            ) {
              this.logger.error({
                tableName: node.testcaseMeta.tableName,
                testcaseName: node.testcaseMeta.testcaseName,
                message: `If the reference is a range, the instanceIdSuffix must be null`,
                details: referenceCmd
              })
            }
          }

          // creates the instanceId for this reference
          const instanceIdForReference =
            node.createReferenceInstanceId(referenceCmd)
          reference.instanceId = instanceIdForReference

          if (referenceSet.has(instanceIdForReference)) {
            // this is an already existing reference. It could be handled the same way as
            // a self reference
            selfReferences.push(reference)
            referenceMap[reference.id] = reference
          } else {
            // this is a new Reference
            referenceSet.add(instanceIdForReference)

            if (node.isSelfReference(referenceCmd)) {
              reference.selfReference = true
              reference.parentNode = node
              reference.targetNode = node
              selfReferences.push(reference)
              referenceMap[reference.id] = reference
            } else {
              // process the reference target and get the target nodes
              const targetTestcaseDefinition =
                targetTable.getTestcaseForName(tcName)
              targetTestcaseDefinition.logger = this.logger

              let targetNodes = []

              targetNodes = await this.createNodeTree(targetTestcaseDefinition)
              for (const targetNode of targetNodes) {
                const newRef = reference.clone()
                referenceMap[newRef.id] = newRef
                newRef.targetNode = targetNode
                targetNode.instanceId = newRef.instanceId
                fieldReferenceIds.push(newRef.id)

                if (targetTestcaseDefinition.neverExecute) {
                  targetNode.neverExecute = true
                }
              }
            }
          }
        }

        // If there are only self references the list could be empty
        if (fieldReferenceIds.length > 0) {
          referenceIdsForCartesian.push(fieldReferenceIds)
        }
      }
    }

    // free some memory
    node.directives.reference = []

    // --------------------------------------
    // Build the cartesian product
    // --------------------------------------
    if (referenceIdsForCartesian.length > 0) {
      const referenceIdMatrix = cartesianProduct(referenceIdsForCartesian)
      for (let refIds of referenceIdMatrix) {
        // create a new parent node
        const newNode = node.clone()
        nodeList.push(newNode)

        if (!Array.isArray(refIds)) {
          // make an array
          refIds = [refIds]
        }

        for (const refId of refIds) {
          const ref = referenceMap[refId]
          const newRef = ref.clone(true)
          // newRef.target = ref.target.clone(true)
          newNode.addReference(newRef)

          // The target node always has the same instanecId as the reference
          if (newRef.targetNode !== undefined) {
            newRef.targetNode.instanceId = newRef.instanceId
          }
        }
      }
    } else {
      nodeList.push(node)
    }

    // --------------------------------------
    // add the self references to each node
    // --------------------------------------
    for (const n of nodeList) {
      for (const selfRef of selfReferences) {
        const newRef = selfRef.clone()
        newRef.parentNode = n
        newRef.targetNode = n
        n.addReference(newRef)
      }
    }

    return nodeList
  }
}
