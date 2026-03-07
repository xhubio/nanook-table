import { TagSectionDefinition } from '../../sections/TagSectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeTagSection(
  request: DeserializeSectionRequest
): TagSectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow
  const sectionObject = new TagSectionDefinition({ name, headerRow })

  // copy the data rows
  for (const rowId of sectionDataRaw._dataRows) {
    sectionObject.tags[rowId] = sectionDataRaw.tags[rowId]
    sectionObject.comments[rowId] = sectionDataRaw.comments[rowId]
    sectionObject.others[rowId] = sectionDataRaw.others[rowId]
    sectionObject.dataRows.push(rowId)
  }

  return sectionObject
}
