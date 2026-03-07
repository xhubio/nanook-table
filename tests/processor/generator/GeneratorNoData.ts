import {
  DataGeneratorBase,
  DataGeneratorGenerateRequest
} from '../../../src/data-generator/index.js'

/**
 * This generator is only used for the process test.
 * It takes the value from the testcase and build an email out of it
 */

export class GeneratorNoData extends DataGeneratorBase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
  async doGenerate(request: DataGeneratorGenerateRequest) {
    return `<EMPTY>`
  }
}
