import type { NodeFieldDirectiveInterface } from './NodeFieldDirectiveInterface.js'
import type { TestcaseDataInterface } from './TestcaseDataInterface.js'

/**
 * Writes meta data from field directives into the test case data object.
 *
 * For each directive in the provided array, this function extracts the instance ID, table name,
 * and field name from the directive's node, then appends an object containing the key, comment,
 * and other information to the corresponding field in the test case data structure.
 *
 * @param testcaseData - The object that stores all information for the current test case.
 * @param directives - An array of NodeFieldDirectiveInterface items representing the field directives to process.
 */
export function writeFieldData(
  testcaseData: TestcaseDataInterface,
  directives: NodeFieldDirectiveInterface[]
) {
  for (const directive of directives) {
    const instanceId = directive.node.instanceId
    const tableName = directive.node.testcaseMeta.tableName
    const fieldName = directive.fieldName

    // Initialize the nested objects in the test case data if they do not exist.
    if (testcaseData.data[tableName] === undefined) {
      testcaseData.data[tableName] = {}
    }
    if (testcaseData.data[tableName][instanceId] === undefined) {
      testcaseData.data[tableName][instanceId] = {}
    }
    if (testcaseData.data[tableName][instanceId][fieldName] === undefined) {
      testcaseData.data[tableName][instanceId][fieldName] = []
    }

    // Append the field data to the test case data.
    testcaseData.data[tableName][instanceId][fieldName].push({
      key: directive.key,
      comment: directive.comment,
      other: directive.other
    })
  }
}
