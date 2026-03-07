import {
  DataGeneratorBase,
  DataGeneratorGenerateRequest
} from '../../../src/data-generator/index.js'

/**
 * This generator is only used for the process test.
 * It takes the value from the testcase and build an email out of it
 */

export class GeneratorMyPerson extends DataGeneratorBase {
  // eslint-disable-next-line require-await
  async doGenerate(request: DataGeneratorGenerateRequest) {
    const { instanceId, testcaseData } = request
    const personData = testcaseData.data[instanceId].Person_no_ref
    if (
      personData !== undefined &&
      (personData['first-name'] !== undefined ||
        personData['last-name'] !== undefined)
    ) {
      return `${personData['first-name'].val}.${personData['last-name'].val}@foo.bar`
    }
    return undefined
  }
}
