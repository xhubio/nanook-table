export { FileProcessor } from './FileProcessor.js'
export type { FileProcessorOptions } from './FileProcessor.js'
export { ParserBase } from './parser/ParserBase.js'
export type { ParserBaseOptions } from './parser/ParserBase.js'
export { ParserMatrix } from './parser/ParserMatrix.js'
export { ParserDecision } from './parser/ParserDecision.js'
export {
  ParserSpecification,
  SpecificationModel
} from './parser/ParserSpecification.js'
export type {
  ParserInterface,
  ParserParseRequest
} from './parser/ParserInterface.js'
export type {
  SpecificationInterface,
  SpecificationFieldInterface,
  SpecificationFieldRuleInterface,
  SpecificationRuleInterface
} from './parser/SpecificationInterface.js'
export { ParserSpecificationConverter } from './parser/specificationConverter/ParserSpecificationConverter.js'
export { RuleConverterRegistry } from './parser/specificationConverter/RuleConverterRegistry.js'
export type {
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult,
  EquivalenceClassEntry,
  FieldRules,
  EquivalenceClasses
} from './parser/specificationConverter/RuleConverterInterface.js'
export { createDefaultConverterRegistry } from './parser/specificationConverter/converters/index.js'
