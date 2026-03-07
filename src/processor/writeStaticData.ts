import type { NodeStaticDirectiveInterface } from './NodeStaticDirectiveInterface.js'
import type { TestcaseDataInterface } from './TestcaseDataInterface.js'

/**
 * Writes static data from the provided directives into the test case data object.
 *
 * For each directive, the function extracts the instance ID, table name, and field name,
 * then stores the static value in the test case data structure under the corresponding keys.
 *
 * @param testcaseData - The object that stores all the information for this test case.
 * @param directives - An array of NodeStaticDirectiveInterface items representing the static data directives to be processed.
 */
export function writeStaticData(
  testcaseData: TestcaseDataInterface,
  directives: NodeStaticDirectiveInterface[]
) {
  for (const directive of directives) {
    // Extract key values from the directive's node.
    const instanceId = directive.node.instanceId
    const tableName = directive.node.testcaseMeta.tableName
    const fieldName = directive.fieldName

    // Initialize the nested objects in testcaseData if they don't exist.
    if (testcaseData.data[tableName] === undefined) {
      testcaseData.data[tableName] = {}
    }
    if (testcaseData.data[tableName][instanceId] === undefined) {
      testcaseData.data[tableName][instanceId] = {}
    }
    if (testcaseData.data[tableName][instanceId][fieldName] === undefined) {
      testcaseData.data[tableName][instanceId][fieldName] = []
    }

    // Write the static value from the directive into the test case data.
    const value = directive.value
    testcaseData.data[tableName][instanceId][fieldName] = value
  }
}
