// Logger
export {
  LoggerInterface,
  LoggerMemory,
  getLoggerMemory
} from './logger/index.js'
export type {
  LoggerMemoryOptions,
  LogEntry,
  LogMessageType
} from './logger/index.js'

// Model
export {
  GeneratorDirective,
  DirectiveBase,
  FieldDirective,
  ReferenceDirective,
  StaticDirective,
  PREFIX_GENERATOR,
  PREFIX_REFERENCE
} from './model/index.js'
export type {
  FilterInterface,
  MetaTable,
  MetaTestcase,
  TableInterface,
  TestcaseDefinitionInterface,
  TestcaseDirectivesInterface,
  GeneratorDirectiveInterface,
  GeneratorDirectiveOptions,
  DirectiveBaseInterface,
  DirectiveBaseOptions,
  FieldDirectiveInterface,
  FieldDirectiveOptions,
  ReferenceDirectiveInterface,
  ReferenceDirectiveOptions,
  StaticDirectiveInterface,
  StaticDirectiveOptions
} from './model/index.js'

// Model-Decision
export {
  ExecuteSectionDefinition,
  FieldSectionDefinition,
  FieldSubSectionDefinition,
  FilterSectionDefinition,
  GeneratorSwitchSectionDefinition,
  MultiRowSectionDefinition,
  MultiplicitySectionDefinition,
  NeverExecuteSectionDefinition,
  SectionType,
  SummarySectionDefinition,
  TagSectionDefinition,
  findDouble,
  combineTestcases,
  TableDecision,
  TestcaseDefinitionDecision,
  TABLE_TYPE_DECISION_TABLE,
  serializeTableDecision,
  serializeTableDecisionToFile
} from './model-decision/index.js'
export type {
  SectionErrorInterface,
  SectionInterface,
  TableDecisionInterface,
  FieldSectionDefinitionOptions,
  FieldSubSectionDefinitionOptions,
  FindDoubleCompareTestcaseResult,
  TableDecisionOptions,
  TestcaseDefinitionDecisionOptions,
  ValidateTestcaseModel,
  ValidateTestcaseModelData,
  ValidateTestcaseModelDataEntry,
  BaseSectionDefinitionOptions
} from './model-decision/index.js'

// Model-Matrix
export {
  TableMatrix,
  TestcaseDefinitionMatrix,
  TABLE_TYPE_MATRIX_TABLE
} from './model-matrix/index.js'
export type {
  TableMatrixOptions,
  TestcaseDefinitionMatrixOptions,
  MetaRowColumn,
  MetaTestcaseMatrix
} from './model-matrix/index.js'

// Data-Generator
export {
  DataGeneratorRegistry,
  DataGeneratorBase,
  GeneratorFaker,
  execStringFunction
} from './data-generator/index.js'
export type {
  DataGeneratorGenerateRequest,
  DataGeneratorInterface,
  DataGeneratorOptions,
  DataGeneratorStore
} from './data-generator/index.js'

// Importer-XLSX
export { ImporterXlsx } from './importer-xlsx/index.js'
export type {
  ImporterXlsxOptions,
  ImporterInterface
} from './importer-xlsx/index.js'

// File-Processor
export {
  FileProcessor,
  ParserBase,
  ParserMatrix,
  ParserDecision,
  ParserSpecification,
  SpecificationModel,
  ParserSpecificationConverter,
  RuleConverterRegistry,
  createDefaultConverterRegistry
} from './file-processor/index.js'
export type {
  FileProcessorOptions,
  ParserBaseOptions,
  ParserInterface,
  ParserParseRequest,
  SpecificationInterface,
  SpecificationFieldInterface,
  SpecificationFieldRuleInterface,
  SpecificationRuleInterface,
  RuleConverterPlugin,
  RuleConversionContext,
  EquivalenceClassResult,
  EquivalenceClassEntry,
  FieldRules,
  EquivalenceClasses
} from './file-processor/index.js'

// Processor
export {
  TestcaseProcessor,
  SimpleArrayFilterProcessor,
  SimpleArrayIgnoreFilterProcessor,
  createDefaultGeneratorRegistry,
  createDefaultWriter,
  createDefaultFileProcessor
} from './processor/index.js'
export type {
  TestcaseProcessorOptions,
  InterfaceWriter,
  FilterProcessorInterface,
  TestcaseDataInterface,
  CallTreeInterface
} from './processor/index.js'
