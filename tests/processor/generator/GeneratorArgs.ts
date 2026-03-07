import {
  DataGeneratorBase,
  DataGeneratorGenerateRequest
} from '../../../src/data-generator/index.js'

/**
 * This generator is only used for the process test.
 * It takes the value given as an argument and returns it
 */

export class GeneratorArgs extends DataGeneratorBase {
  // eslint-disable-next-line require-await
  async doGenerate(request: DataGeneratorGenerateRequest) {
    if (request.generatorDirective !== undefined) {
      return request.generatorDirective.config
    }
  }
}
