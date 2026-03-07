import {
  DataGeneratorBase,
  DataGeneratorGenerateRequest
} from '../../../src/data-generator/index.js'

/**
 * This generator is only used for the process test.
 * It takes the value from the testcase and build an email out of it
 */
export class GeneratorMyPerson extends DataGeneratorBase {
  async generate(request: DataGeneratorGenerateRequest) {
    const { instanceId, testcaseData, generatorDirective } = request
    if (generatorDirective !== undefined) {
      const args = generatorDirective.config

      if (instanceId && this.instanceData.has(instanceId + args)) {
        return this.instanceData.get(instanceId + args)
      }
      const genData = await this.doGenerate({
        instanceId: `${instanceId}${args}`,
        testcaseData,
        generatorDirective
      })
      if (genData !== undefined && instanceId) {
        this.instanceData.set(instanceId + args, genData)
      }
      return genData
    }
  }

  // eslint-disable-next-line require-await
  async doGenerate(request: DataGeneratorGenerateRequest) {
    const { instanceId, testcaseData, generatorDirective } = request

    if (generatorDirective === undefined) {
      throw new Error('Test: generatorDirective must not be undefined')
    }
    const args = generatorDirective.config
    const testcaseMeta = generatorDirective.testcaseMeta

    if (args === undefined) {
      throw new Error(
        JSON.stringify({
          message: `If this generator is called, the name of the method must be given.`,
          testcaseMeta,
          args
        })
      )
    }

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
