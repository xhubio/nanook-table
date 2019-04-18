/**
 * This validator expects objects created by the reference.
 * The reference is without field name
 */

export default class ValidatorObject {
  constructor(opts = {}) {
    // The expected data
    this.expected = opts.expected
    this.targetTableName = opts.targetTableName
  }

  /**
   * Calls the expect method
   */
  validate(actual) {
    const expTableNames = Object.keys(this.expected)
    for (const expTableName of expTableNames) {
      const expTableData = this.expected[expTableName]
      // Check that the expected table exists
      expect(actual[expTableName]).toBeDefined()

      const expTestcaseNames = Object.keys(expTableData)

      // check that the table result exists
      for (const expTestcaseName of expTestcaseNames) {
        const dat = actual[expTableName][expTestcaseName]

        // check that the target table name exists
        const targetTableName = this.targetTableName

        expect(dat.data[targetTableName]).toBeDefined()
        for (const otherInstId of Object.keys(dat.data[targetTableName])) {
          // this for loop should always have only one otherInstId

          // now we are in the other data
          const otherDat = dat.data[targetTableName][otherInstId]
          const exp = expTableData[expTestcaseName].target
          expect(otherDat).toEqual(exp)
        }

        // -------------------
        // Test the source data
        // -------------------
        const exp = expTableData[expTestcaseName].source
        const act = dat.data[expTableName][dat.instanceId]
        exp.tcName = expTestcaseName
        act.tcName = expTestcaseName
        expect(act).toEqual(exp)
      }

      // Check for each table that the count of test cases matches
      expect(expTestcaseNames.length).toBe(
        Object.keys(actual[expTableName]).length
      )
    }
    // check the count of actual test cases compared to the expected count
    expect(expTableNames.length).toBe(Object.keys(actual).length)
  }
}
