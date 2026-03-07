import { TableDecision } from '../TableDecision.js'
import {
  ValidateRowModel,
  ValidateTestcaseModel,
  ValidateTestcaseModelDataEntry
} from './validateModelInterface.js'

/**
 * Builds the test case model from a given decision table and its row model.
 *
 * The test case model is represented as an array of test case objects. Each test case object has:
 * - An `id` that uniquely identifies it.
 * - A `data` object that maps section IDs to their corresponding data entries.
 * - A `name` property.
 * - A `skip` flag indicating whether the test case should be skipped.
 *
 * Each data entry for a section contains:
 * - `parentSectionId`: The ID of the parent section.
 * - `rows`: An array of row IDs for that sub-section.
 * - `val`: A numeric value computed by converting the binary representation of the row data.
 *   If the section has more than 31 rows, the value is split into multiple numbers.
 * - `valStr`: The binary string representation of the value(s).
 *
 * @param table - The decision table model.
 * @param rowModel - The row model that maps each sub-section row ID to its row details.
 * @returns An array of test case model objects.
 */
export function buildTestcaseModel(
  table: TableDecision,
  rowModel: ValidateRowModel
): ValidateTestcaseModel[] {
  // Initialize an array to hold the test case model objects.
  const model: ValidateTestcaseModel[] = []

  // Iterate over each test case ID in the order defined in the table.
  table.testcaseOrder.forEach((tcId) => {
    // Retrieve the test case definition from the table.
    const testcase = table.testcases[tcId]
    // Create a test case model object with default properties.
    const testCaseObject: ValidateTestcaseModel = {
      id: tcId,
      data: {},
      name: '',
      skip: false
    }
    // Add the test case object to the model array.
    model.push(testCaseObject)

    // Process each sub-section entry from the row model.
    Object.entries(rowModel).forEach(([sectionKey, subSection]) => {
      // Create a new data entry for this section.
      const testcaseEntry: ValidateTestcaseModelDataEntry = {
        rows: subSection.rows,
        parentSectionId: subSection.parentSectionId
      }
      // Assign the data entry to the corresponding section key in the test case object.
      testCaseObject.data[sectionKey] = testcaseEntry

      // Initialize an array to store binary indicators (0 or 1) for each row in the sub-section.
      let values: number[] = []

      // Iterate over each row in the sub-section.
      subSection.rows.forEach((rowId) => {
        // If no value is present for this row, push 0; otherwise, push 1.
        if (testcase.data[rowId] === undefined) {
          values.push(0)
        } else {
          values.push(1)
        }
      })

      // If the number of fields is less than 32, combine the binary values into a single number.
      if (values.length < 32) {
        // Reverse the array to align the binary digits correctly, then join to form a binary string.
        const binValue = values.reverse().join('')
        // Convert the binary string to a number (base 2).
        testcaseEntry.val = parseInt(binValue, 2)
        // Store the binary string representation.
        testcaseEntry.valStr = binValue
      } else {
        // If there are 32 or more fields, split the binary values into chunks (maximum 30 bits each).
        testcaseEntry.val = []
        testcaseEntry.valStr = []
        while (values.length > 0) {
          const count = 30
          let binValue: string
          if (count > values.length) {
            // If the remaining values are fewer than the chunk size, join all remaining values.
            binValue = values.join('')
            values = []
          } else {
            // Otherwise, take a slice of the array for the current chunk.
            binValue = values.slice(0, count).join('')
            // Remove the processed values from the array.
            values.splice(0, count)
          }
          // Convert the binary string chunk to a number and add it to the array.
          testcaseEntry.val.push(parseInt(binValue, 2))
          // Also store the binary string chunk.
          testcaseEntry.valStr.push(binValue)
        }
      }
    })
  })

  // Return the constructed test case model.
  return model
}
