import type { RuleConverterPlugin } from './RuleConverterInterface.js'

/**
 * Stores all the rule converter plugins
 */
export class RuleConverterRegistry {
  private converters: Map<string, RuleConverterPlugin> = new Map()

  register(converter: RuleConverterPlugin): void {
    if (this.converters.has(converter.name)) {
      throw new Error(
        `A rule converter with name '${converter.name}' is already registered`
      )
    }
    this.converters.set(converter.name, converter)
  }

  get(name: string): RuleConverterPlugin | undefined {
    return this.converters.get(name)
  }

  has(name: string): boolean {
    return this.converters.has(name)
  }

  names(): string[] {
    return [...this.converters.keys()]
  }
}
