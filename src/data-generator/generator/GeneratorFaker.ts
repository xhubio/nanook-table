import { execStringFunction } from './execStringFunction.js'
import { faker } from '@faker-js/faker'
import { DataGeneratorOptions, DataGeneratorBase } from '../DataGeneratorBase.js'
import { DataGeneratorGenerateRequest } from '../DataGeneratorInterface.js'

/**
 * This is a Generator using Faker to create Data. The Faker function to be used is
 * given as a parameter.
 */
export class GeneratorFaker extends DataGeneratorBase {
  constructor(opts: DataGeneratorOptions) {
    super(opts)

    /** Defines if the generated value must be unique. Default is 'false' */
    this.unique = false
  }

  /**
   * Generates the value and saves it for the given instance.
   * @param request - The parameters as defined in @see DataGeneratorGenerateRequest
   * @returns The generated data. If the data could not be generated because of missing data
   * then the generator should return 'undefined'. So it could be called later. This may be the case if the generator
   * needs referenced data which is not generated yet.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async generate(request: DataGeneratorGenerateRequest): Promise<any> {
    const { instanceId, testcaseData, generatorDirective } = request

    if (generatorDirective?.config === undefined || generatorDirective.config === '') {
      throw new Error(
        'No Arguments given for Generator Faker. The argument defines which faker function to call'
      )
    }

    const args = generatorDirective.config

    if (instanceId && this.instanceData.has(instanceId + args)) {
      return this.instanceData.get(instanceId + args)
    }
    const genData = await this.doGenerate({
      instanceId: instanceId + args,
      testcaseData,
      generatorDirective
    })
    if (genData !== undefined && instanceId) {
      this.instanceData.set(instanceId + args, genData)
    }
    return genData
  }

  /**
   * @param request - The parameters as defined in @see DataGeneratorGenerateRequest
   * @returns The generated data. If the data could not be generated because of missing data
   */
  // eslint-disable-next-line require-await
  protected async doGenerate(
    request: DataGeneratorGenerateRequest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const { testcaseData, generatorDirective } = request

    const args = generatorDirective?.config
    if (args === undefined || typeof args !== 'string') {
      throw new Error(`If this generator is called, the name of the method must be given.
      See https://www.npmjs.com/package/faker for more details.
      If you would like to call faker.name.firstname() you have to give the arguments 'name.firstname'`)
    } else {
      try {
        return execStringFunction(args.split('.'), faker)
      } catch (err) {
        this.logger.error({
          message: err,
          generator: 'GeneratorFaker',
          testcase: testcaseData.name,
          args
        })
        throw err
      }
    }
  }
}
