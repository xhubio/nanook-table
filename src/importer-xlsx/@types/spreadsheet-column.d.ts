declare module 'spreadsheet-column' {
  interface SpreadsheetColumnOptions {
    zero?: boolean
  }

  interface ConvertedResult {
    original: string | number
    converted: string | number
  }

  class SpreadsheetColumn {
    fromZero: boolean
    arr: string[]

    constructor(opt?: SpreadsheetColumnOptions)

    /**
     * Converts an integer to a string column name using letters.
     * @param n - Number to convert into a spreadsheet column name.
     * @returns The corresponding column name as a string.
     */
    fromInt(n: number): string

    /**
     * Converts a string column name into its numeric version.
     * @param s - Column name to convert into a number.
     * @returns The corresponding column number.
     */
    fromStr(s: string): number

    /**
     * Converts a string containing letters and digits into their respective values.
     * @param thing - Input string to parse.
     * @returns An array of converted results.
     */
    fromAny(thing: string): ConvertedResult[]

    /**
     * Converts a numeric index to its corresponding letter.
     * @param idx - Numeric index of the letter.
     * @returns The corresponding letter.
     */
    private getLetterByIndex(idx: number): string

    /**
     * Converts a letter to its corresponding numeric index.
     * @param letter - The letter to convert.
     * @returns The corresponding numeric index.
     */
    private getIndexByLetter(letter: string): number

    /**
     * Converts an ASCII code to a letter if it corresponds to a valid letter [A-Z].
     * @param code - ASCII code.
     * @returns The corresponding letter or an empty string.
     */
    private letter(code: number): string

    /**
     * Initializes the class with the provided options.
     * @param opt - Initialization options.
     */
    private init(opt?: SpreadsheetColumnOptions): void
  }

  export = SpreadsheetColumn
}
