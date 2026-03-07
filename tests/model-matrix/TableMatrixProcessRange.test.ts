import { test, expect } from 'vitest'
import { TableMatrix } from '../../src/model-matrix/index.js'
import { TableMatrixOptions } from '../../src/model-matrix/TableMatrix.js'

const TEST_DATA = [
  ['r1:c3', ['r1:c3'], 'No range'],
  ['[r1:c3]', ['r1:c3'], 'Range definition but not a real range'],
  ['[r2-4:c3]', ['r2:c3', 'r3:c3', 'r4:c3'], 'Range definition for the row'],
  ['[r2:c3-5]', ['r2:c3', 'r2:c4', 'r2:c5'], 'Range definition for the column'],
  [
    '[r2-3:c3-5]',
    ['r2:c3', 'r2:c4', 'r2:c5', 'r3:c3', 'r3:c4', 'r3:c5'],
    'Range definition for the row and the column'
  ],
  [
    '[r4-2:c3]',
    ['r2:c3', 'r3:c3', 'r4:c3'],
    'Descending: Range definition for the row'
  ],
  [
    '[r2:c5-3]',
    ['r2:c3', 'r2:c4', 'r2:c5'],
    'Descending: Range definition for the column'
  ],
  [
    '[r3-2:c5-3]',
    ['r2:c3', 'r2:c4', 'r2:c5', 'r3:c3', 'r3:c4', 'r3:c5'],
    'Descending: Range definition for the row and the column'
  ]
]

const table = new TableMatrix({} as TableMatrixOptions)

for (const testData of TEST_DATA) {
  const range = testData[0]
  const expected = testData[1]
  const name = testData[2]

  test(`${name}`, () => {
    const result = table.processRanges(range as string)
    expect(result).toEqual(expected)
  })
}
