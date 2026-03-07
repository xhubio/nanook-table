import { RuleConverterRegistry } from '../RuleConverterRegistry.js'
import { PrimaryKeyConverter } from './PrimaryKeyConverter.js'
import { TypeConverter } from './TypeConverter.js'
import { MandatoryConverter } from './MandatoryConverter.js'
import { MinConverter } from './MinConverter.js'
import { MaxConverter } from './MaxConverter.js'
import { EmailConverter } from './EmailConverter.js'
import { RegexConverter } from './RegexConverter.js'

export { PrimaryKeyConverter } from './PrimaryKeyConverter.js'
export { TypeConverter } from './TypeConverter.js'
export { MandatoryConverter } from './MandatoryConverter.js'
export { MinConverter } from './MinConverter.js'
export { MaxConverter } from './MaxConverter.js'
export { EmailConverter } from './EmailConverter.js'
export { RegexConverter } from './RegexConverter.js'

/**
 * Creates a RuleConverterRegistry pre-populated with all built-in converters.
 */
export function createDefaultConverterRegistry(): RuleConverterRegistry {
  const registry = new RuleConverterRegistry()
  registry.register(PrimaryKeyConverter)
  registry.register(TypeConverter)
  registry.register(MandatoryConverter)
  registry.register(MinConverter)
  registry.register(MaxConverter)
  registry.register(EmailConverter)
  registry.register(RegexConverter)
  return registry
}
