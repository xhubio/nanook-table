import { GeneratorSwitchSectionDefinition } from '../../sections/GeneratorSwitchSectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeGeneratorSwitchSection(
  request: DeserializeSectionRequest
): GeneratorSwitchSectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow
  const sectionObject = new GeneratorSwitchSectionDefinition({
    name,
    headerRow
  })

  // copy the data rows
  for (const rowId of sectionDataRaw._dataRows) {
    sectionObject.generatorNames[rowId] = sectionDataRaw.generatorNames[rowId]
    sectionObject.values[rowId] = sectionDataRaw.values[rowId]
    sectionObject.comments[rowId] = sectionDataRaw.comments[rowId]
    sectionObject.dataRows.push(rowId)
  }

  return sectionObject
}
