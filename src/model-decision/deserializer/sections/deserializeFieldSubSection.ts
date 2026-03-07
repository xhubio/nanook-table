import { FieldSubSectionDefinition } from '../../sections/FieldSubSectionDefinition.js'
import { TableDecision } from '../../TableDecision.js'

export interface DeserializeFieldSubSectionRequest {
  /** The raw JSON Object to be deserialized */
  sectionDataRaw: any // eslint-disable-line @typescript-eslint/no-explicit-any

  /** The decision table */
  table: TableDecision

  /** The id of the parent section */
  parentSectionId: string
}

export function deserializeFieldSubSection(
  request: DeserializeFieldSubSectionRequest
): FieldSubSectionDefinition {
  const { sectionDataRaw, parentSectionId } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow
  const mandatory = sectionDataRaw.mandatory
  const tdgMandatory = sectionDataRaw.tdgMandatory
  const sectionObject = new FieldSubSectionDefinition({
    name,
    headerRow,
    parent: parentSectionId,
    mandatory,
    tdgMandatory
  })

  // copy the data rows
  for (const rowId of sectionDataRaw._dataRows) {
    sectionObject.equivalenceClasses[rowId] =
      sectionDataRaw.equivalenceClasses[rowId]
    sectionObject.comments[rowId] = sectionDataRaw.comments[rowId]
    sectionObject.tdgs[rowId] = sectionDataRaw.tdgs[rowId]
    sectionObject.dataRows.push(rowId)
  }

  return sectionObject
}
