import { DirectiveBase } from './DirectiveBase.js'
import type {
  DirectiveBaseInterface,
  DirectiveBaseOptions
} from './DirectiveBase.js'

/**
 * Represents a directive for invoking a generator.
 *
 * When processing a table, all generator calls are collected into a list of directives.
 * These directives are then executed until each generator has produced its data.
 */
export interface GeneratorDirectiveInterface extends DirectiveBaseInterface {
  /**
   * The name of the generator to be invoked.
   */
  generatorName: string

  /**
   * The configuration or parameters for this generator call.
   */
  config: string

  /**
   * The suffix for the instanceId to distinguish multiple calls.
   */
  instanceIdSuffix: string

  /**
   * Determines the execution order of generator directives.
   * Lower numbers are executed before higher numbers.
   */
  order: number
}

/**
 * Options for creating a GeneratorDirective instance.
 */
export interface GeneratorDirectiveOptions extends DirectiveBaseOptions {
  /**
   * The name of the generator to be invoked.
   */
  generatorName: string

  /**
   * The configuration or parameters for this generator call.
   */
  config: string

  /**
   * The suffix for the instanceId to distinguish multiple calls.
   */
  instanceIdSuffix: string

  /**
   * Determines the execution order of generator directives.
   * Lower numbers are executed first. Defaults to 1000 if not provided.
   */
  order?: number
}

/**
 * Implementation of a directive for calling a generator.
 */
export class GeneratorDirective
  extends DirectiveBase
  implements GeneratorDirectiveInterface
{
  generatorName: string
  config: string
  instanceIdSuffix: string
  order: number

  constructor(opts: GeneratorDirectiveOptions) {
    super(opts)
    this.generatorName = opts.generatorName
    this.config = opts.config
    this.instanceIdSuffix = opts.instanceIdSuffix
    this.order = opts.order || 1000
  }
}
