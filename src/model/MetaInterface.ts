/**
 * Contains meta-information about a table.
 *
 * This interface defines the essential metadata for a table, including the source file,
 * the human-readable table name, and the type or category of the table.
 */
export interface MetaTable {
  /** The name of the file from which the table originates. */
  fileName: string

  /** The human-readable name of the table. */
  tableName: string

  /** The type or category of the table. */
  tableType: string
}

/**
 * Extends MetaTable with additional details specific to a test case.
 *
 * This interface adds test case-specific metadata, such as the test case name,
 * to the basic table metadata defined in MetaTable.
 */
export interface MetaTestcase extends MetaTable {
  /** The name of the test case within the table. */
  testcaseName: string
}
