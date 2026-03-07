import { NeverExecuteSectionDefinition } from '../../sections/NeverExecuteSectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeNeverExecuteSection(
  request: DeserializeSectionRequest
): NeverExecuteSectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow
  const sectionObject = new NeverExecuteSectionDefinition({ name, headerRow })

  return sectionObject
}
