/**
 * The DataGeneratorRegistry is a centralized service registry that manages all data generators
 * by their unique names. It enables generators to reference each other for composing complex generation
 * workflows and is used by the processor to access the required generators.
 */
import { DataGeneratorInterface } from './DataGeneratorInterface.js'

export class DataGeneratorRegistry {
  /**
   * Internal map that stores data generators by their unique names.
   */
  registry: Map<string, DataGeneratorInterface> = new Map<
    string,
    DataGeneratorInterface
  >()

  /**
   * Registers a data generator in the registry.
   *
   * A generator registered under a name that is already taken replaces the
   * earlier one: the last registration wins. This lets a script register its
   * own 'faker' on a registry from `createDefaultGeneratorRegistry()`, which
   * already holds one.
   *
   * @param generatorName - The name the tables use to call the generator.
   * @param dataGenerator - The instance of the data generator to be registered.
   */
  registerGenerator(
    generatorName: string,
    dataGenerator: DataGeneratorInterface
  ) {
    // Assign the generator's name and store it in the registry.
    dataGenerator.name = generatorName
    this.registry.set(generatorName, dataGenerator)
  }

  /**
   * Invokes the `saveStore()` method on each registered data generator.
   *
   * This method persists the state of all generators in the registry.
   */
  async saveStore(): Promise<void> {
    for (const generatorName of this.registry.keys()) {
      const dataGenerator = this.registry.get(generatorName)
      if (dataGenerator !== undefined) {
        await dataGenerator.saveStore()
      }
    }
  }

  /**
   * Invokes the `loadStore()` method on each registered data generator.
   *
   * This method restores the state of all generators from persistent storage.
   */
  async loadStore(): Promise<void> {
    for (const genName of this.registry.keys()) {
      const dataGenerator = this.registry.get(genName)
      if (dataGenerator !== undefined) {
        await dataGenerator.loadStore()
      }
    }
  }

  /**
   * Retrieves a data generator by its unique name.
   *
   * @param generatorName - The name under which the generator is registered.
   * @returns The data generator associated with the specified name.
   *
   * @throws Error If no generator is found with the given name.
   */
  getGenerator(generatorName: string): DataGeneratorInterface {
    const dataGenerator = this.registry.get(generatorName)

    if (dataGenerator === undefined) {
      throw new Error(
        `There was no generator registered with the name '${generatorName}'`
      )
    }

    return dataGenerator
  }
}
