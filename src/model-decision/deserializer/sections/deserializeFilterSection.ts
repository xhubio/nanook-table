import { FilterSectionDefinition } from '../../sections/FilterSectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeFilterSection(
  request: DeserializeSectionRequest
): FilterSectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.nam
  const headerRow = sectionDataRaw.headerRow
  const sectionObject = new FilterSectionDefinition({ name, headerRow })

  // copy the data rows
  for (const rowId of sectionDataRaw._dataRows) {
    sectionObject.filterProcessorNames[rowId] =
      sectionDataRaw.filterProcessorNames[rowId]
    sectionObject.expressions[rowId] = sectionDataRaw.expressions[rowId]
    sectionObject.comments[rowId] = sectionDataRaw.comments[rowId]
    sectionObject.dataRows.push(rowId)
  }

  return sectionObject
}
