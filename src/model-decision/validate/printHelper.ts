import { sprintf } from 'sprintf-js'
import { ValidateTestcaseModel } from './validateModelInterface.js'

export function printHelper(tc: ValidateTestcaseModel) {
  let str = `${tc.name}\t`
  Object.keys(tc.data).forEach((sectionRowId) => {
    const val = tc.data[sectionRowId].val
    // let valStr: any = val.toString(2).split('').reverse().join('');
    if (val !== undefined) {
      let valStr = val.toString(2)
      const length = tc.data[sectionRowId].rows.length
      valStr = sprintf(`%0${length}s`, valStr)
      str += `${valStr}\t`
    }
  })
  // eslint-disable-next-line no-console
  console.log(str)
}
