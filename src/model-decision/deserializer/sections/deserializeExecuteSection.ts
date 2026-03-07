import { ExecuteSectionDefinition } from '../../sections/ExecuteSectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeExecuteSection(
  request: DeserializeSectionRequest
): ExecuteSectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow

  const sectionObject = new ExecuteSectionDefinition({ name, headerRow })
  return sectionObject
}
