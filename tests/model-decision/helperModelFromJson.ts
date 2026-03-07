// import fs from 'node:fs/promises'
// import {
//   ExecuteSectionDefinition,
//   FieldSectionDefinition,
//   FieldSubSectionDefinition,
//   MultiplicitySectionDefinition,
//   MultiRowSectionDefinition,
//   SectionInterface,
//   SectionType,
//   SummarySectionDefinition,
//   TABLE_TYPE_DECISION_TABLE,
//   TableDecision,
//   TestcaseDefinitionDecision
// } from '../../src/model-decision/index.js'
// import { LoggerMemory } from '../../src/logger/index.js'

// /**
//  * Creates a real model from a serialized JSON Object.
//  * This is only used for tests.
//  * @param fileName - The file name of the JSON file
//  * @returns The created model json
//  */
// export async function createModel(fileName: string) {
//   const tableData = JSON.parse(await fs.readFile(fileName, 'utf8'))
//   return createModelFromBuffer(tableData)
// }

// /**
//  * Creates a real model from a serialized JSON Object.
//  * This is only used for tests.
//  * @param fileName - The file name of the JSON file
//  * @returns - The created model
//  */
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export function createModelFromBuffer(tableDataRaw: any) {
//   const table = new TableDecision({
//     logger: new LoggerMemory(),
//     fileName: 'myFileName',
//     tableName: tableDataRaw.tableName
//   })

//   table.testcaseOrder = tableDataRaw.testcaseOrder

//   // add the test cases
//   for (const tcId of tableDataRaw.testcaseOrder) {
//     const testcaseRawData = tableDataRaw.testcases[tcId]

//     const testcase = new TestcaseDefinitionDecision({
//       testcaseName: testcaseRawData.name,
//       tableMeta: {
//         fileName: 'myFileName',
//         tableName: tableDataRaw.tableName,
//         tableType: TABLE_TYPE_DECISION_TABLE
//       },
//       table,
//       logger: table.logger,
//       data: testcaseRawData.data
//     })

//     testcase.id = tcId
//     testcase.isPartOfCompletion = testcaseRawData.isPartOfCompletion
//     table.testcases[tcId] = testcase
//   }

//   // iterates the sections
//   Object.keys(tableDataRaw.sections).forEach((sectionId) => {
//     const sectionData = tableDataRaw.sections[sectionId]
//     table.sectionOrder.push(sectionId)
//     assignSection({ table, sectionData, sectionId })
//   })

//   return table
// }

// /**
//  * Assignes a single section data to an section Object
//  * @param table - The table object
//  * @param sectionData - The section data to be morphed into a real object
//  * @param sectionId - The id of this section
//  * @param parent - For subSections this is the parent section object
//  */
// function assignSection(request: {
//   table: TableDecision
//   sectionData: SectionDataInterface
//   sectionId: string
//   parentSection?: FieldSectionDefinition
// }) {
//   const { parentSection, sectionData, sectionId, table } = request

//   const sectionType = sectionData.sectionType
//   const name = sectionData.name
//   const mandatory = sectionData.mandatory
//   const tdgMandatory = sectionData.tdgMandatory

//   // console.log(`SectionName: ${name}  type:${sectionType}`)

//   let sectionObject: SectionInterface
//   if (sectionType === SectionType.SUMMARY_SECTION) {
//     sectionObject = new SummarySectionDefinition({ name })
//   } else if (sectionType === SectionType.MULTI_ROW_SECTION) {
//     sectionObject = new MultiRowSectionDefinition({ name })
//   } else if (sectionType === SectionType.FIELD_SECTION) {
//     sectionObject = new FieldSectionDefinition({
//       mandatory,
//       name,
//       tdgMandatory
//     })
//   } else if (sectionType === SectionType.FIELD_SUB_SECTION) {
//     if (parentSection === undefined) {
//       throw new Error(
//         `A subSection must have a parent: sectionId = ${sectionId}`
//       )
//     }
//     sectionObject = new FieldSubSectionDefinition({
//       parent: parentSection.headerRow,
//       mandatory,
//       name,
//       tdgMandatory
//     })
//   } else if (sectionType === SectionType.MULTIPLICITY_SECTION) {
//     sectionObject = new MultiplicitySectionDefinition({ name })
//   } else if (sectionType === SectionType.EXECUTE_SECTION) {
//     sectionObject = new ExecuteSectionDefinition({ name })
//   } else {
//     throw new Error(
//       `Unkown section type '${sectionType}' in section '${sectionId}'`
//     )
//   }

//   sectionObject.headerRow = sectionId

//   if (sectionType === SectionType.FIELD_SUB_SECTION) {
//     if (parentSection === undefined) {
//       throw new Error(
//         `A subSection must have a parent: sectionId = ${sectionId}`
//       )
//     }
//     // a subSection must be set to the parent section
//     parentSection.subSections[sectionId] =
//       sectionObject as FieldSubSectionDefinition
//   } else {
//     table.sections[sectionId] = sectionObject
//   }

//   if (sectionObject !== undefined && sectionData.subSections !== undefined) {
//     for (const subSectionId of Object.keys(sectionData.subSections)) {
//       const subSectionData = sectionData.subSections[subSectionId]
//       assignSection({
//         table,
//         sectionData: subSectionData,
//         sectionId: subSectionId,
//         parentSection: sectionObject as FieldSectionDefinition
//       })
//     }
//   }
// }

// // function assignMultiRowSection(request: {
// //   table: TableDecision
// //   sectionData: SectionDataInterface
// //   sectionId: string
// //   parentSection?: FieldSectionDefinition
// // }) {}

// // function assignFieldSection(request: {
// //   table: TableDecision
// //   sectionData: SectionDataInterface
// //   sectionId: string
// //   parentSection?: FieldSectionDefinition
// // }) {}

// // function assignFieldSubSection(request: {
// //   table: TableDecision
// //   sectionData: SectionDataInterface
// //   sectionId: string
// //   parentSection?: FieldSectionDefinition
// // }) {}

// interface SectionDataInterface {
//   /** The type of the section. To be overwrite by a sub class. */
//   sectionType: SectionType

//   /** The name of this section. */
//   name?: string

//   /** Defines if the section must have at least one value. */
//   mandatory?: boolean

//   tdgMandatory?: boolean

//   /** defines if this section may have more than one row. */
//   multiple: boolean

//   /**
//    * This id is used to identify a row or section in the model.
//    * All rows and columns are identified by auch an id.
//    * This is the id of the header row
//    * Fixme: rename to headerRowId
//    */
//   headerRow: string

//   /** Stores the IDs of the data rows. Not the rows itself. */
//   dataRows: string[]

//   subSections?: Record<string, SectionDataInterface>
// }
