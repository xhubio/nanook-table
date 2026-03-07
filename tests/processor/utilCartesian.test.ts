import { test, expect } from 'vitest'
import { cartesianProduct } from '../../src/processor/utilCartesian.js'

interface TestDataEntry {
  data: string[][]
  expected: string[] | string[][]
  name: string
}

const TEST_DATA: TestDataEntry[] = [
  {
    data: [['1', '2', '3']],
    expected: ['1', '2', '3'],
    name: 'single array'
  },
  {
    data: [
      ['1', '2', '3'],
      ['a', 'b', 'c']
    ],
    expected: [
      ['1', 'a'],
      ['1', 'b'],
      ['1', 'c'],
      ['2', 'a'],
      ['2', 'b'],
      ['2', 'c'],
      ['3', 'a'],
      ['3', 'b'],
      ['3', 'c']
    ],
    name: 'two arrays'
  },
  {
    data: [
      ['1', '2', '3'],
      ['a', 'b', 'c'],
      ['x', 'y']
    ],
    expected: [
      ['1', 'a', 'x'],
      ['1', 'a', 'y'],
      ['1', 'b', 'x'],
      ['1', 'b', 'y'],
      ['1', 'c', 'x'],
      ['1', 'c', 'y'],
      ['2', 'a', 'x'],
      ['2', 'a', 'y'],
      ['2', 'b', 'x'],
      ['2', 'b', 'y'],
      ['2', 'c', 'x'],
      ['2', 'c', 'y'],
      ['3', 'a', 'x'],
      ['3', 'a', 'y'],
      ['3', 'b', 'x'],
      ['3', 'b', 'y'],
      ['3', 'c', 'x'],
      ['3', 'c', 'y']
    ],
    name: 'three arrays'
  }
]

for (const { data, expected, name } of TEST_DATA) {
  test(`${name}`, () => {
    const result = cartesianProduct(data)
    expect(result).toEqual(expected)
  })
}
