import {
  FieldSectionDefinition,
  TableDecision
} from '../../../model-decision/index.js'
import type { SpecificationInterface } from '../SpecificationInterface.js'
import type { LoggerInterface } from '../../../logger/index.js'
import type { SpecificationModel } from '../ParserSpecification.js'
import type {
  EquivalenceClasses,
  FieldRules,
  RuleConversionContext
} from './RuleConverterInterface.js'
import type { RuleConverterRegistry } from './RuleConverterRegistry.js'
import { createDefaultConverterRegistry } from './converters/index.js'

/**
 * Rules for converting a specification table into a decision table
 * - For each rule a ruleConverter could be registered to create the data for the rule
 *
 * - Every field name from the specification table creates a fieldSection in the specification table
 * - Every Rule used in a fieldName creates a fielSubSection
 *   # The rule short name is the name of the subSection
 *   # The rule description is the description of the sub section
 *   # The subSection name and generator value could be overwritten by the registered ruleConverter
 * - The severity creates a fieldSubSection in a generic multiRowSection
 *
 */

interface RowIdObject {
  /** contains all the VALID rowIds. The Ids of tests which should not create an error */
  valid: string[]

  /** The rowIds of the tests which should create an error */
  error: string[]
}

/**
 * Converts a specification object into a decision table model.
 * It takes a loaded specification table and converts it.
 */
export class ParserSpecificationConverter {
  private registry: RuleConverterRegistry

  constructor(options?: { registry?: RuleConverterRegistry }) {
    this.registry = options?.registry ?? createDefaultConverterRegistry()
  }

  /**
   * Do the conversion
   * @param specification - The specification object
   * @param logger - The logger
   * @returns The created decision table model
   */
  convert(request: {
    specification: SpecificationInterface
    logger: LoggerInterface
    fileName: string
  }): TableDecision {
    const { fileName, logger, specification } = request
    /** Stores the decision table object */
    const table = new TableDecision({
      logger,
      tableName: specification.name,
      fileName
    })

    this.createExecutionMultirowSection(table)

    const secDataObject = this.createSecondaryDataSection(specification, table)
    const rowIdObjects = this.createPrimaryDataSection(specification, table)

    this.createSummarySection(table)
    this.createSeveritySection(specification, table)

    this.createTestcases({ table, rowIdObjects, secDataObject })

    return table
  }

  /**
   * Creates a multirow section which defines if a testcase should be executed or is test data only
   * @param table - The decision table model
   */
  private createExecutionMultirowSection(table: TableDecision): void {
    const section = table.addNewMultiRowSection('Execute')

    const rowIdExe = section.createNewRow()
    const rowIdData = section.createNewRow()

    section.keys[rowIdExe] = 'Testcase'
    section.comments[rowIdExe] = 'This is a testcase which should be executed'

    section.keys[rowIdData] = 'Data only'
    section.comments[rowIdData] =
      'This is only data referenced from other testcases'
  }

  /**
   * Creates the summary section for this table
   * @param table - The decision table model
   */
  private createSummarySection(table: TableDecision): void {
    table.addNewSummarySection('Summary')
  }

  /**
   * Creates a multirow section for the serverities
   * @param specification - The specification object
   * @param table - The decision table model
   */
  private createSeveritySection(
    specification: SpecificationModel,
    table: TableDecision
  ): void {
    const section = table.addNewMultiRowSection('Severity')

    specification.severities.forEach((name) => {
      const rowId = section.createNewRow()
      section.keys[rowId] = name
    })
  }

  /**
   * Creates the primary data section and returns an array
   * of rowIdObjects
   * @param specification - The specification object
   * @param table - The decision table model
   * @returns An array of rowIdObjects
   */
  private createPrimaryDataSection(
    specification: SpecificationInterface,
    table: TableDecision
  ): RowIdObject[] {
    // Stores the field Ids
    // const fields: any = {};
    const section = table.addNewFieldSection('Primary Data')

    const rowIdObjects: RowIdObject[] = []

    // iterate all the fieldNames of the specification table
    for (const fieldName of Object.keys(specification.fields)) {
      const fieldData = specification.fields[fieldName]

      // Stores the rules by there name
      const rules: FieldRules = {}

      if (fieldData.rules !== undefined) {
        fieldData.rules.forEach((rule) => {
          let ruleName = rule.ruleName
          if (typeof ruleName === 'string') {
            ruleName = ruleName.toUpperCase()
          }
          rules[ruleName] = rule
        })
      }

      // get all the equivalence classes for this field
      const equivalenceClasses = this.getClassesForRules({
        specification,
        fieldRules: rules,
        fieldData
      })

      // create the field in the decision table model
      const rowIdObj = this.createFieldSubSection({
        section,
        fieldName,
        classes: equivalenceClasses
      })
      rowIdObjects.push(rowIdObj)
    }

    return rowIdObjects
  }

  /**
   * Create all the equivalenceClasses for one field using registered converters.
   * @param specification - The specification object. Only the Rules description is needed
   * @param fieldRules - All the rules for this field (keyed by uppercased rule name)
   * @param fieldData - The original field data from the specification
   * @returns The created equivalenceClasses for this field
   */
  private getClassesForRules(request: {
    specification: SpecificationInterface
    fieldRules: FieldRules
    fieldData: { rules: { ruleName: string; value: string; severity: string }[] }
  }) {
    const { specification, fieldRules, fieldData } = request

    // These rules are handled by registered converters
    const predefined: Record<string, string> = {
      PK: '1',
      TYPE: '1',
      C1: '1',
      C2: '1',
      C3: '1',
      C4: '1',
      C5: '1'
    }

    // Start with the base valid classes.
    // The 'not null' class always exists. If C1 (mandatory) is absent,
    // 'null' (empty) is also valid. This mirrors the original hardcoded order.
    const classes: EquivalenceClasses = {
      valid: {
        'not null': {
          comment: ['Not Empty']
        }
      },
      error: {}
    }

    if (fieldRules.C1 === undefined) {
      classes.valid['null'] = { comment: ['Empty'] }
    }

    // Define the fixed processing order for predefined rules.
    // This order matches the original hardcoded logic.
    const processingOrder = ['PK', 'C1', 'C2', 'C3', 'C4', 'C5', 'TYPE']

    // Process predefined rules in fixed order via converters
    for (const ruleName of processingOrder) {
      if (fieldRules[ruleName] === undefined) {
        continue
      }

      const converter = this.registry.get(ruleName)
      if (converter === undefined) {
        continue
      }

      const rule = fieldRules[ruleName]
      const context: RuleConversionContext = {
        field: {
          name: fieldData.rules[0]?.ruleName ?? '',
          fieldNameInternal: '',
          rules: fieldData.rules
        },
        rule,
        allFieldRules: fieldData.rules,
        specification
      }

      const result = converter.convert(context)

      // Aggregate valid classes
      for (const entry of result.validClasses) {
        if (classes.valid[entry.name] !== undefined) {
          // Merge: append comment to existing class (skip empty comments)
          if (entry.comment !== '') {
            classes.valid[entry.name].comment.push(entry.comment)
          }
        } else {
          // Create new valid class
          if (entry.comment !== '') {
            classes.valid[entry.name] = { comment: [entry.comment] }
          } else {
            classes.valid[entry.name] = { comment: [] }
          }
        }
      }

      // Aggregate error classes
      for (const entry of result.errorClasses) {
        const severity = entry.severity ?? rule.severity
        if (classes.error[entry.name] !== undefined) {
          // Merge: append comment and severity
          classes.error[entry.name].comment.push(entry.comment)
          classes.error[entry.name].severity.push(severity)
        } else {
          classes.error[entry.name] = {
            comment: [entry.comment],
            severity: [severity]
          }
        }
      }
    }

    // Add all the custom rules (non-predefined)
    for (const ruleName of Object.keys(fieldRules)) {
      if (predefined[ruleName] === undefined) {
        const fieldRule = fieldRules[ruleName]
        const comment = specification.rules[ruleName].shortDesc
        classes.error[ruleName] = {
          comment: [comment],
          severity: [fieldRule.severity]
        }
      }
    }

    return classes
  }

  /**
   * Creates a secondary data section if the specification has a primary key rule.
   * Adds two fields to it
   * @param specification - The specification object
   * @param table - The decision table model
   * @returns The rowIdObject
   */
  private createSecondaryDataSection(
    specification: SpecificationInterface,
    table: TableDecision
  ): RowIdObject {
    const rowIdObj: RowIdObject = {
      valid: [],
      error: []
    }

    if (specification.rules.PK !== undefined) {
      const section = table.addNewFieldSection('Secondary Data')
      const field1 = section.createNewField()
      field1.name = specification.name

      const rowIdExist = field1.createNewRow()
      const rowIdNew = field1.createNewRow()

      rowIdObj.valid.push(rowIdExist)
      rowIdObj.valid.push(rowIdNew)

      field1.equivalenceClasses[rowIdExist] = 'Record already exists'
      field1.comments[rowIdExist] =
        'There is already a record with the same primary key'

      field1.equivalenceClasses[rowIdNew] = 'Record is new'
      field1.comments[rowIdNew] = 'There is no record with this primary key'
    }

    return rowIdObj
  }
  /**
   * Creates the default testcases for this decision table
   * @param table - The decision table model
   * @param rowIdObjects - An array with all the primary data rowIdObjects
   * @param secDataObject - The secondary rowidObjewct
   */
  private createTestcases(request: {
    table: TableDecision
    rowIdObjects: RowIdObject[]
    secDataObject: RowIdObject
  }): void {
    const { table, rowIdObjects, secDataObject } = request

    let tcName = 0

    // Iterate the fields of the primary data
    for (let i = 0; i < rowIdObjects.length; i++) {
      const mainObject = rowIdObjects[i]
      mainObject.error.forEach((rowId) => {
        tcName++
        const tc = table.addNewTestcase(`${tcName}`)
        tc.data[rowId] = 'x'

        // set for all the following fields all the 'e'
        for (let j = i + 1; j < rowIdObjects.length; j++) {
          const nextObject = rowIdObjects[j]
          nextObject.error.forEach((rowIdNext) => {
            tc.data[rowIdNext] = 'e'
          })
          nextObject.valid.forEach((rowIdNext) => {
            tc.data[rowIdNext] = 'a'
          })
        }

        if (i > 0) {
          // set for all the previous fields all the valid ones to 'e'
          for (let k = 0; k < i; k++) {
            const nextObject = rowIdObjects[k]
            nextObject.valid.forEach((rowIdPrev) => {
              tc.data[rowIdPrev] = 'a'
            })
          }
        }

        // set the secundary data to 'a'
        secDataObject.valid.forEach((rowIdSec) => {
          tc.data[rowIdSec] = 'a'
        })
      })
    }
  }

  /**
   * Create one field of the primary data section. Also adds the rowId to the class.
   * Returns an object of the following format:
   * obj = \{
   *     valid : [rowIds]
   *     error : [rowIds]
   * \}
   *
   * @param section - The primary data field section
   * @param fieldName - The name of the field
   * @param classes - The equivalenceClasses for this field
   * @returns - The object containing all the rowIds by there type
   */
  private createFieldSubSection(request: {
    section: FieldSectionDefinition
    fieldName: string
    classes: EquivalenceClasses
  }): RowIdObject {
    const { section, fieldName, classes } = request
    const field = section.createNewField()
    field.name = fieldName

    const rowIdObj: RowIdObject = {
      error: [],
      valid: []
    }

    for (const type of ['valid', 'error'] as (keyof EquivalenceClasses)[]) {
      for (const className of Object.keys(classes[type])) {
        const clazz = classes[type][className]
        const comment = clazz.comment
        const rowId = field.createNewRow()

        rowIdObj[type as keyof RowIdObject].push(rowId)

        field.equivalenceClasses[rowId] = `${type} ${className}`
        field.comments[rowId] = comment.join(', ')
      }
    }

    return rowIdObj
  }
}
