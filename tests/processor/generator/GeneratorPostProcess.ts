import {
  DataGeneratorBase,
  DataGeneratorGenerateRequest
} from '../../../src/data-generator/index.js'
import type { GeneratorDirectiveInterface } from '../../../src/model/index.js'

/**
 * This generator is only used for the process test.
 * It takes the value from the testcase and build an email out of it
 */

export class GeneratorPostProcess extends DataGeneratorBase {
  genCalls?: string[]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
  async doGenerate(request: DataGeneratorGenerateRequest) {
    return `<GeneratorPostProcess>`
  }

  // eslint-disable-next-line require-await
  async postProcess(
    request: DataGeneratorGenerateRequest
  ): Promise<GeneratorDirectiveInterface[] | undefined> {
    const { generatorDirective } = request

    if (this.genCalls === undefined) {
      this.genCalls = []
    }
    if (generatorDirective !== undefined) {
      this.genCalls.push(generatorDirective.fieldName)
    }

    return
  }
}
