import { LoggerInterface } from '../logger/index.js'
import { GeneratorDirectiveInterface } from '../model/index.js'
import { DataGeneratorRegistry } from './DataGeneratorRegistry.js'

/**
 * Interface representing the parameters for a data generation request.
 */
export interface DataGeneratorGenerateRequest {
  /**
   * The unique identifier for the test case instance.
   * For the same instance ID, the same generated data object is expected.
   */
  instanceId: string

  /**
   * The already generated test case data object, if available.
   */
  testcaseData?: any // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * An optional generator directive associated with the generation process.
   */
  generatorDirective?: GeneratorDirectiveInterface
}

/**
 * Interface defining the structure and functionality of a data generator.
 *
 * A data generator is responsible for generating test case data, handling persistent storage,
 * and managing internal state such as uniqueness and instance-specific data.
 */
export interface DataGeneratorInterface {
  // Properties

  /**
   * The registry containing all available data generators.
   */
  generatorRegistry: DataGeneratorRegistry

  /**
   * The unique name assigned when this generator is registered in the service registry.
   */
  name: string

  /**
   * Logger instance used for logging purposes.
   * If not provided, a default logger (e.g., LoggerMemory) may be used.
   */
  logger?: LoggerInterface

  /**
   * Flag indicating whether the generator should produce unique values.
   * The definition of uniqueness depends on the generator implementation.
   */
  unique?: boolean

  /**
   * Maximum number of attempts to generate a unique value before throwing an error.
   */
  maxUniqueTries?: number

  /**
   * Directory path used for persistently storing unique data.
   */
  varDir?: string

  /**
   * Indicates whether the generator should use persistent storage.
   */
  useStore?: boolean

  /**
   * The name of the persistent data store associated with this generator.
   */
  storeName?: string

  /**
   * Read-only getter for the file name of the persistent store.
   */
  readonly storeFileName: string

  // Methods

  /**
   * Retrieves a registered generator by its unique name.
   *
   * @param generatorName - The name of the generator to retrieve.
   * @returns The data generator corresponding to the specified name.
   */
  getGenerator(generatorName: string): any // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Clears the generator's internal context, including cached data and unique value sets.
   */
  clearContext(): void

  /**
   * Loads stored data from the persistent store.
   *
   * This method restores any previously persisted state into the generator's context.
   */
  loadStore(): Promise<void>

  /**
   * Saves the current generator data to the persistent store.
   */
  saveStore(): Promise<void>

  /**
   * Retrieves the current data in the format that would be stored persistently.
   *
   * @returns An object containing arrays for unique values and instance-specific data.
   */
  getStoreData(): { uniqueSet: any[]; instanceData: any[] } // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Generates data for a test case based on the provided request parameters.
   *
   * @param request - The parameters required for data generation.
   * @returns A promise that resolves to the generated data object,
   *          or `undefined` if data generation is not possible.
   */
  generate(request: DataGeneratorGenerateRequest): Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Creates post-processing directives that may be required after data generation.
   *
   * This is useful when additional processing or coordination between generators is needed.
   *
   * @param request - The parameters for data generation.
   * @returns A promise that resolves to an array of post-process directives,
   *          or `undefined` if no directives are required.
   */
  createPostProcessDirectives(
    request: DataGeneratorGenerateRequest
  ): Promise<GeneratorDirectiveInterface[] | undefined>

  /**
   * Performs post-processing on the generated data.
   *
   * This method is invoked after all primary data generation has completed.
   *
   * @param request - The parameters for data generation.
   * @returns A promise that resolves to an array of post-process directives,
   *          or `undefined` if no post-processing is needed.
   */
  postProcess(
    request: DataGeneratorGenerateRequest
  ): Promise<GeneratorDirectiveInterface[] | undefined>
}
