import { TableDecision } from '../TableDecision.js'
import { buildRowModel } from './buildRowModel.js'
import { buildTestcaseModel } from './buildTestcaseModel.js'
import { ValidateTestcaseModel } from './validateModelInterface.js'

/**
 * Combines the existing test cases to simplify identifying unresolved ones.
 *
 * This function compares each field of every pair of test cases in the table.
 * If two test cases differ in exactly one field and the differing field's values
 * are bitwise disjunct (i.e. they share no common bits), they can be merged.
 * Merging is performed by applying a bitwise OR to the differing field in the master test case,
 * and marking the other test case as skipped. The process repeats in rounds until no further
 * combinations are possible.
 *
 * @param table - The decision table model containing the test cases.
 * @returns The combined test case model as an array of ValidateTestcaseModel objects.
 */
export function combineTestcases(
  table: TableDecision
): ValidateTestcaseModel[] {
  const rowModel = buildRowModel(table)
  const testCaseModel = buildTestcaseModel(table, rowModel)

  let shouldContinue = true
  while (shouldContinue && testCaseModel.length > 1) {
    shouldContinue = false

    // Iterate over each pair of test cases.
    for (let i = 0; i < testCaseModel.length - 1; i++) {
      const testcaseMaster = testCaseModel[i]
      testcaseMaster.name = `${i + 1}`
      if (testcaseMaster.skip === true) {
        // Skip test cases that have already been merged.
        continue
      }
      for (let j = i + 1; j < testCaseModel.length; j++) {
        const testcaseCompare = testCaseModel[j]
        testcaseCompare.name = `${j + 1}`
        if (testcaseCompare.skip === true) {
          continue
        }

        // Attempt to combine the two test cases.
        if (combineTestcasesSub(testcaseMaster, testcaseCompare)) {
          shouldContinue = true
        }
      }
    }
  }

  return testCaseModel
}

/**
 * Checks if two values (or arrays of values) are bitwise disjunct.
 *
 * For arrays, it performs an element-wise bitwise AND and sums the results.
 * For numbers, it directly computes the bitwise AND.
 * A result of zero indicates that the values have no overlapping bits.
 *
 * @param val1 - The first value or array of numbers.
 * @param val2 - The second value or array of numbers.
 * @returns True if the values are disjunct, otherwise false.
 * @throws Error if one parameter is an array and the other is not.
 */
export function combineTestcasesIsDisjunct(
  val1: number | number[],
  val2: number | number[]
): boolean {
  if (Array.isArray(val1) && Array.isArray(val2)) {
    let sum = 0
    for (let i = 0; i < val1.length; i++) {
      sum += val1[i] & val2[i]
    }
    return sum === 0
  }

  if (Array.isArray(val1) || Array.isArray(val2)) {
    throw new Error('could not happen')
  }

  return (val1 & val2) === 0
}

/**
 * Attempts to combine two test cases if they differ in exactly one field,
 * and if that field's values are bitwise disjunct.
 *
 * The function iterates over the fields in the test case data. If it finds exactly one
 * field where the values differ, it verifies that the differing values are disjunct.
 * If so, it merges the field values by applying a bitwise OR and marks the second test case
 * as skipped (merging it into the first). If more than one field differs, or if the differing
 * field values are not disjunct, combination is not possible.
 *
 * @param tc1 - The master test case which will absorb the combination.
 * @param tc2 - The test case to be merged into tc1.
 * @returns True if the test cases were successfully combined; otherwise, false.
 * @throws Error if any required field value is undefined.
 */
export function combineTestcasesSub(
  tc1: ValidateTestcaseModel,
  tc2: ValidateTestcaseModel
): boolean {
  const diffSections: string[] = []
  let isFalse = false // Indicates that combination is not possible.

  // Compare each field in the test case data.
  Object.keys(tc1.data).forEach((sectionRowId) => {
    const val1 = tc1.data[sectionRowId].val
    const val2 = tc2.data[sectionRowId].val
    if (Array.isArray(val1) && Array.isArray(val2)) {
      // For fields represented as arrays, check each element.
      let isEqual = true
      for (let j = 0; j < val1.length; j++) {
        if (val1[j] !== val2[j]) {
          isEqual = false
        }
      }
      if (!isEqual) {
        // If values differ, ensure they are disjunct.
        if (
          tc1.data[sectionRowId].val !== undefined &&
          tc2.data[sectionRowId].val !== undefined &&
          combineTestcasesIsDisjunct(
            tc1.data[sectionRowId].val,
            tc2.data[sectionRowId].val
          )
        ) {
          diffSections.push(sectionRowId)
        } else {
          isFalse = true
          return
        }
      }
    } else if (val1 !== val2) {
      // For numeric fields, if they differ, check for disjunction.
      if (
        tc1.data[sectionRowId].val !== undefined &&
        tc2.data[sectionRowId].val !== undefined &&
        combineTestcasesIsDisjunct(
          tc1.data[sectionRowId].val,
          tc2.data[sectionRowId].val
        )
      ) {
        diffSections.push(sectionRowId)
      } else {
        isFalse = true
        return
      }
    }
  })

  // If exactly one field is different, combine the test cases.
  if (!isFalse && diffSections.length === 1) {
    const indexKey = diffSections[0]
    const val1 = tc1.data[indexKey].val
    const val2 = tc2.data[indexKey].val

    if (val1 === undefined || val2 === undefined) {
      throw new Error('The "val" of the ValidateTestcaseModelData is undefined')
    }

    // Merge the differing values using bitwise OR.
    if (Array.isArray(val1) && Array.isArray(val2)) {
      for (let j = 0; j < val1.length; j++) {
        val1[j] |= val2[j]
      }
    } else if (!Array.isArray(val1) && !Array.isArray(val2)) {
      tc1.data[indexKey].val = val1 | val2
    }

    // Record the merge by noting that tc2 has been combined into tc1.
    if (tc1.merge === undefined) {
      tc1.merge = []
    }
    tc1.merge.push(tc2.id)

    // Mark tc2 as skipped, as it has been merged.
    tc2.skip = true

    return true
  }

  return false
}
