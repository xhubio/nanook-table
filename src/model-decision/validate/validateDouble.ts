import { TableDecision } from '../TableDecision.js'
import { buildRowModel } from './buildRowModel.js'
import { buildTestcaseModel } from './buildTestcaseModel.js'
import {
  ValidateTestcaseModel,
  ValidateTestcaseModelData
} from './validateModelInterface.js'

/**
 * Finds duplicate (double) test case definitions in the given decision table.
 *
 * This function first constructs a row model and a test case model from the table,
 * and then identifies duplicates by comparing the binary field values of each test case.
 *
 * @param table - The decision table model.
 * @returns An array of duplicate test case entries, where each entry contains the IDs
 *          of the two duplicate test cases and the comparison result.
 */
export function findDouble(table: TableDecision) {
  const rowModel = buildRowModel(table)
  const testCaseModel: ValidateTestcaseModel[] = buildTestcaseModel(
    table,
    rowModel
  )
  return findDoubleSub(testCaseModel)
}

/**
 * Compares each pair of test cases to identify duplicates.
 *
 * This function iterates over all pairs of test cases in the provided model.
 * For each pair, it compares their field values using a bitwise AND operation.
 * If all compared fields yield a non-zero result (indicating overlap), the pair is considered a duplicate.
 *
 * @param testCaseModel - An array of test case models.
 * @returns An array of objects representing duplicate test case pairs.
 */
function findDoubleSub(testCaseModel: ValidateTestcaseModel[]) {
  const doubles = []
  for (let i = 0; i < testCaseModel.length - 1; i++) {
    const testcaseMaster = testCaseModel[i]
    for (let j = i + 1; j < testCaseModel.length; j++) {
      const testcaseCompare = testCaseModel[j]

      const result = findDoubleCompareTestcase(
        testcaseMaster.data,
        testcaseCompare.data
      )
      if (result !== undefined) {
        // Record duplicate test cases along with their comparison result.
        const entry = {
          tcId1: testcaseMaster.id,
          tcId2: testcaseCompare.id,
          result
        }
        doubles.push(entry)
      }
    }
  }
  return doubles
}

/**
 * Defines the result of comparing two test cases.
 *
 * This type maps each section row ID to either a number or an array of numbers,
 * representing the bitwise AND result of the field values.
 */
export type FindDoubleCompareTestcaseResult = Record<string, number | number[]>

/**
 * Compares two test cases to determine if they are duplicates.
 *
 * For each field in the test case data, the function performs a bitwise AND operation.
 * If the result is non-zero for every field, the test cases are considered duplicates.
 * If field values are stored as arrays (when there are more than 30 rows), each element is compared.
 *
 * @param tc1 - The data object of the first test case.
 * @param tc2 - The data object of the second test case.
 * @returns A mapping of section row IDs to the bitwise AND results if the test cases are duplicates;
 *          otherwise, undefined.
 * @throws Error if any field value is undefined.
 */
export function findDoubleCompareTestcase(
  tc1: ValidateTestcaseModelData,
  tc2: ValidateTestcaseModelData
): FindDoubleCompareTestcaseResult | undefined {
  const results: FindDoubleCompareTestcaseResult = {}
  let isDouble = true
  Object.keys(tc1).forEach((sectionRowId) => {
    // Retrieve the field values for the current section.
    const tc1Val = tc1[sectionRowId].val
    const tc2Val = tc2[sectionRowId].val

    if (tc1Val === undefined || tc2Val === undefined) {
      throw new Error('The "val" of the ValidateTestcaseModelData is undefined')
    }

    // If the field values are arrays, compare each element.
    if (Array.isArray(tc1Val) && Array.isArray(tc2Val)) {
      const subRes: number[] = []
      let isDoubleSubentry = false
      for (let i = 0; i < tc1Val.length; i++) {
        const res = tc1Val[i] & tc2Val[i]
        if (res !== 0) {
          // A non-zero result indicates overlapping bits for this subentry.
          isDoubleSubentry = true
        }
        subRes.push(res)
      }
      if (!isDoubleSubentry) {
        // If all subentries are zero, the field does not match.
        isDouble = false
        return // Exit the forEach loop.
      }
      results[sectionRowId] = subRes
    } else if (!Array.isArray(tc1Val) && !Array.isArray(tc2Val)) {
      // For scalar values, perform a direct bitwise AND.
      const res: number = tc1Val & tc2Val
      if (res === 0) {
        isDouble = false
        return undefined
      }
      results[sectionRowId] = res
    }
  })

  if (isDouble) {
    return results
  }

  return
}
