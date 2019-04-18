export default class Validator {
  constructor(opts = {}) {
    // The expected data
    this.expected = opts.expected
  }

  /**
   * Calls the expect method
   */
  validate(actual) {
    // const dat = actual.data[actual.instanceId]
    const expTableNames = Object.keys(this.expected)
    for (const expTableName of expTableNames) {
      const expTableData = this.expected[expTableName]
      // Check that the expected table exists
      expect(actual[expTableName]).toBeDefined()

      const expTestcaseNames = Object.keys(expTableData)

      // check that the table result exists
      for (const expTestcaseName of expTestcaseNames) {
        // Check that the expected test case exists
        expect(actual[expTableName][expTestcaseName]).toBeDefined()

        const exp = expTableData[expTestcaseName]
        const dat = actual[expTableName][expTestcaseName]
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
