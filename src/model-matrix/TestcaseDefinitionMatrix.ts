import { v4 as uuidv4 } from 'uuid'
import {
  TestcaseDefinitionInterface,
  TestcaseDirectivesInterface,
  FilterInterface,
  MetaTable,
  PREFIX_GENERATOR,
  PREFIX_REFERENCE,
  GeneratorDirective,
  ReferenceDirective,
  StaticDirective,
  MetaTestcase
} from '../model/index.js'
import { MetaRowColumn } from './Meta.js'
import { LoggerInterface } from '../logger/index.js'
import { TableMatrix } from './TableMatrix.js'

/**
 * Enum to distinguish whether the meta data is from a row or a column.
 */
enum RowColumn {
  ROW = 'row',
  COLUMN = 'column'
}

/**
 * Options for initializing a TestcaseDefinitionMatrix.
 */
export interface TestcaseDefinitionMatrixOptions {
  /** The row number from which this test case originates. */
  rowNumber: number

  /** The column number from which this test case originates. */
  columnNumber: number

  /** Meta information for the row. */
  rowMeta: MetaRowColumn

  /** Meta information for the column. */
  columnMeta: MetaRowColumn

  /** The meta information of the table. */
  tableMeta: MetaTable

  /**
   * The data for this test case.
   * In a decision table, a test case is typically represented by a column.
   * All the data in that column is stored by an identifier, which corresponds to a value in a row.
   */
  data?: string | number

  /** Logger instance for logging purposes. */
  logger: LoggerInterface

  /** Indicates whether this test case should be executed or treated as a reference. */
  execute?: boolean

  /** A back reference to the matrix table containing this test case. */
  table: TableMatrix
}

/**
 * Represents a test case in a matrix table.
 *
 * In a matrix table, a test case corresponds to a single cell identified by its row and column.
 * The class implements the TestcaseDefinitionInterface.
 */
export class TestcaseDefinitionMatrix implements TestcaseDefinitionInterface {
  /**
   * The data for this test case.
   * For a decision table, a test case is represented as a column, where the data is stored
   * by an identifier corresponding to a value in the row.
   */
  data?: string | number

  /** Logger instance for this test case model. */
  logger: LoggerInterface

  /** The row number from which this test case originates. */
  rowNumber: number

  /** The column number from which this test case originates. */
  columnNumber: number

  /** Meta information for the row. */
  rowMeta: MetaRowColumn

  /** Meta information for the column. */
  columnMeta: MetaRowColumn

  /** A reference to the table (matrix) that contains this test case. */
  table: TableMatrix

  /** The meta information of the table. */
  tableMeta: MetaTable

  /** Unique identifier for this test case. */
  id: string = uuidv4()

  /** Number of instances to generate for this test case (default is 1). */
  multiplicity: number = 1

  /** Flag indicating that this test case should never be executed (default is false). */
  neverExecute: boolean = false

  constructor(opts: TestcaseDefinitionMatrixOptions) {
    this.rowNumber = opts.rowNumber
    this.columnNumber = opts.columnNumber
    this.table = opts.table
    this.data = opts.data
    this.logger = opts.logger
    this.tableMeta = opts.tableMeta
    this.rowMeta = opts.rowMeta
    this.columnMeta = opts.columnMeta
  }

  createTags(): string[] {
    return []
  }
  createFilter(): FilterInterface[] {
    return []
  }
  createGeneratorSwitches(): string[] {
    return []
  }

  get testcaseName(): string {
    return `r${this.rowNumber}:c${this.columnNumber}`
  }

  get testcaseMeta(): MetaTestcase {
    return {
      fileName: this.tableMeta.fileName,
      tableName: this.tableMeta.tableName,
      tableType: this.tableMeta.tableName,
      testcaseName: this.testcaseName
    }
  }

  getFieldName(name: string) {
    return name
  }

  get execute(): boolean {
    if (
      this.data !== undefined &&
      (this.columnMeta.execute || this.rowMeta.execute)
    ) {
      return true
    }
    return false
  }

  /**
   * Creates all directives for this test case definition.
   *
   * The directives are generated based on the meta data of both the row and column.
   * Depending on the generator command found in the meta data, the method creates
   * generator, reference, or static directives.
   *
   * @returns An object containing arrays of directives, grouped by type.
   */
  createDirectives(): TestcaseDirectivesInterface {
    const directives: TestcaseDirectivesInterface = {
      generator: [],
      static: [],
      reference: [],
      field: []
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    function doCreateDirectives(type: RowColumn, meta: MetaRowColumn) {
      const generatorCmd = meta.generator

      if (generatorCmd !== undefined) {
        if (generatorCmd.toLowerCase().startsWith(PREFIX_GENERATOR)) {
          const directive = self.createGeneratorDirective(
            generatorCmd,
            type,
            meta
          )
          directives.generator.push(directive)
        } else if (generatorCmd.toLowerCase().startsWith(PREFIX_REFERENCE)) {
          const directive = self.createReferenceDirective(
            generatorCmd,
            type,
            meta
          )
          directives.reference.push(directive)
        }
      } else {
        const directive = self.createStaticValueDirective(
          generatorCmd,
          type,
          meta
        )
        directives.static.push(directive)
      }
    }

    doCreateDirectives(RowColumn.ROW, this.rowMeta)
    doCreateDirectives(RowColumn.COLUMN, this.columnMeta)

    return directives
  }

  private createGeneratorDirective(
    generatorCmd: string,
    type: RowColumn,
    metaRowColumn: MetaRowColumn
  ) {
    const parts = generatorCmd.split(':')
    parts.shift()
    const instanceIdSuffix = parts.shift()
    const generatorName = parts.shift()
    const config = parts.join(':')

    if (
      instanceIdSuffix === undefined ||
      generatorName === undefined ||
      config === undefined
    ) {
      throw new Error(`The generatorCmd '${generatorCmd}' is invalid`)
    }

    const directive = new GeneratorDirective({
      fieldName: this.getFieldName(metaRowColumn.name || type),
      config,
      generatorName,
      instanceIdSuffix,
      testcaseMeta: this.testcaseMeta
    })

    return directive
  }

  private createReferenceDirective(
    referenceCmd: string,
    type: RowColumn,
    metaRowColumn: MetaRowColumn
  ) {
    const parts = referenceCmd.split(':')
    const instanceIdSuffix = parts[1]
    const targetTableName = parts[2] || this.tableMeta.tableName
    const targetFieldName = parts[3]
    const targetTestcaseName = parts[4]

    if (
      targetTableName === undefined ||
      targetFieldName === undefined ||
      targetTestcaseName === undefined
    ) {
      throw new Error(`The referenceCmd '${referenceCmd}' is invalid`)
    }

    const directive = new ReferenceDirective({
      fieldName: this.getFieldName(metaRowColumn.name || type),
      testcaseMeta: this.testcaseMeta,
      instanceIdSuffix,
      targetFieldName,
      targetTableName,
      targetTestcaseName
    })

    return directive
  }

  private createStaticValueDirective(
    staticValue: string,
    type: RowColumn,
    metaRowColumn: MetaRowColumn
  ) {
    const directive = new StaticDirective({
      fieldName: this.getFieldName(metaRowColumn.name || type),
      testcaseMeta: this.testcaseMeta,
      value: staticValue
    })

    return directive
  }
}
