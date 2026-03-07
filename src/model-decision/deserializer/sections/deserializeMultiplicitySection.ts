import { MultiplicitySectionDefinition } from '../../sections/MultiplicitySectionDefinition.js'
import { DeserializeSectionRequest } from './DeserializeSectionRequestInterface.js'

export function deserializeMultiplicitySection(
  request: DeserializeSectionRequest
): MultiplicitySectionDefinition {
  const { sectionDataRaw } = request
  const name = sectionDataRaw.name
  const headerRow = sectionDataRaw.headerRow
  const sectionObject = new MultiplicitySectionDefinition({ name, headerRow })
  return sectionObject
}
