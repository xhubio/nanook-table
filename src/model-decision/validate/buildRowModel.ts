import { FieldSectionDefinition } from '../sections/FieldSectionDefinition.js'
import { SectionType } from '../sections/SectionTypeEnum.js'
import { TableDecision } from '../TableDecision.js'
import { ValidateRowModel, ValidateRowModelRow } from './validateModelInterface.js'

/**
 * Constructs a validation row model from a given decision table.
 *
 * This function iterates over the section order of the provided table. For each section
 * that is a FIELD_SECTION, it iterates over its data rows (sub-sections), extracts the
 * corresponding row IDs, and creates a validation row model entry. Each entry contains
 * the list of row IDs for that sub-section and the ID of the parent section.
 *
 * @param table - The decision table model from which to build the row model.
 * @returns A validation row model mapping each sub-section row ID to its corresponding model row.
 */
export function buildRowModel(table: TableDecision): ValidateRowModel {
  const model: ValidateRowModel = {}

  // Iterate over each section in the order defined in the table.
  table.sectionOrder.forEach((sectionRowId) => {
    const section = table.sections[sectionRowId]
    // Process only sections of type FIELD_SECTION.
    if (section.sectionType === SectionType.FIELD_SECTION) {
      const fieldSection = section as FieldSectionDefinition

      // For each data row (sub-section) in the field section, create a model entry.
      section.dataRows.forEach((subSectionRowId) => {
        const subSection = fieldSection.subSections[subSectionRowId]
        const rowIds = subSection.dataRows

        // Build the validation row model entry.
        const singleRow: ValidateRowModelRow = {
          rows: rowIds,
          parentSectionId: sectionRowId
        }

        // Map the sub-section row ID to its corresponding model entry.
        model[subSectionRowId] = singleRow
      })
    }
  })

  return model
}
