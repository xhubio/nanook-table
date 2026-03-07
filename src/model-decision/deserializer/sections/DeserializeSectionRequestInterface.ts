import { TableDecision } from '../../TableDecision.js'

export interface DeserializeSectionRequest {
  /** The raw JSON Object to be deserialized */
  sectionDataRaw: any // eslint-disable-line @typescript-eslint/no-explicit-any

  /** The decision table */
  table: TableDecision

  /** The Id of this section */
  sectionId: string
}
