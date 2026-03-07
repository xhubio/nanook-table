import { MultiRowSectionDefinition } from '../../sections/MultiRowSectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeMultiRowSection(
  request: DeserializeSectionRequest
): MultiRowSectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow
  const sectionObject = new MultiRowSectionDefinition({ name, headerRow })

  // copy the data rows
  for (const rowId of sectionDataRaw._dataRows) {
    sectionObject.keys[rowId] = sectionDataRaw.keys[rowId]
    sectionObject.comments[rowId] = sectionDataRaw.comments[rowId]
    sectionObject.others[rowId] = sectionDataRaw.others[rowId]
    sectionObject.dataRows.push(rowId)
  }

  return sectionObject
}
