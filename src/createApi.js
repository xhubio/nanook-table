import util from 'util'
import path from 'path'
import { exec } from 'child_process'
import mkdirp from 'mkdirp'

import { modifyMarkdown } from './insertHeaderInMarkdown'

const md = util.promisify(mkdirp)

const websiteRepoPath =
  '/Users/torstenlink/Documents/entwicklung/nanook/nanook-website'
const DOC_PATH = path.join(websiteRepoPath, 'docs')

/**
 * {
 *   // The soure js file
 *   src: 'src/myFile.js',
 *
 *   // The target path for the markdown file in the website repo relative to docs
 *   target: 'api/logger/myLogger.md',
 *
 *   // The id as it was defined in the sidebar.json
 *   id: 'overview',
 *   title: 'Overview',
 *   sidebar_label: 'Overview',
 * },
 *
 */

const INPUT = [
  // ---------------------------------------------
  // - data generator
  // ---------------------------------------------
  {
    src:
      'node_modules/@xhubiotable/data-generator/src/DataGeneratorInterface.js',
    target: 'api/dataGenerator/DataGeneratorInterface.md',
    id: 'DataGeneratorInterface',
    title: 'Data Generator Interface',
    sidebar_label: 'Data Generator Interface',
  },
  {
    src: 'node_modules/@xhubiotable/data-generator/src/DataGeneratorBase.js',
    target: 'api/dataGenerator/DataGeneratorBase.md',
    id: 'DataGeneratorBase',
    title: 'Data Generator Base',
    sidebar_label: 'Data Generator Base',
  },
  {
    src: 'node_modules/@xhubiotable/data-generator/src/TDGServiceRegistry.js',
    target: 'api/dataGenerator/TDGServiceRegistry.md',
    id: 'TDGServiceRegistry',
    title: 'Service Registry',
    sidebar_label: 'Service Registry',
  },
  {
    src:
      'node_modules/@xhubiotable/data-generator/src/generator/GeneratorFaker.js',
    target: 'api/dataGenerator/GeneratorFaker.md',
    id: 'GeneratorFaker',
    title: 'Generator Faker',
    sidebar_label: 'Generator Faker',
  },
  // ---------------------------------------------
  // - file processor
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/file-processor/src/ImporterInterface.js',
    target: 'api/file-processor/ImporterInterface.md',
    id: 'ImporterInterface',
    title: 'Importer Interface',
    sidebar_label: 'Importer Interface',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/src/ParserInterface.js',
    target: 'api/file-processor/ParserInterface.md',
    id: 'ParserInterface',
    title: 'Parser Interface',
    sidebar_label: 'Parser Interface',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/src/FileProcessor.js',
    target: 'api/file-processor/FileProcessor.md',
    id: 'FileProcessor',
    title: 'File Processor',
    sidebar_label: 'File Processor',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/src/ParserConstants.js',
    target: 'api/file-processor/FileProcessor.md',
    id: 'FileProcessor',
    title: 'Parser Constants',
    sidebar_label: 'Parser Constants',
  },
  // Decision ------------------------------------
  {
    src:
      'node_modules/@xhubiotable/file-processor/src/ParserDecisionConstants.js',
    target: 'api/file-processor/decision/ParserDecisionConstants.md',
    id: 'ParserDecisionConstants',
    title: 'Parser Decision Constants',
    sidebar_label: 'Parser Decision Constants',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/src/ParserDecision.js',
    target: 'api/file-processor/decision/ParserDecision.md',
    id: 'ParserDecision',
    title: 'Parser Decision',
    sidebar_label: 'Parser Decision',
  },
  // Matrix --------------------------------------
  {
    src:
      'node_modules/@xhubiotable/file-processor/src/ParserMatrixConstants.js',
    target: 'api/file-processor/matrix/ParserMatrixConstants.md',
    id: 'ParserMatrixConstants',
    title: 'Parser Matrix Constants',
    sidebar_label: 'Parser Matrix Constants',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/src/ParserMatrix.js',
    target: 'api/file-processor/matrix/ParserMatrix.md',
    id: 'ParserMatrix',
    title: 'Parser Matrix',
    sidebar_label: 'Parser Matrix',
  },
  // Specification -------------------------------
  {
    src:
      'node_modules/@xhubiotable/file-processor/src/ParserSpecificationConstants.js',
    target: 'api/file-processor/specification/ParserSpecificationConstants.md',
    id: 'ParserSpecificationConstants',
    title: 'Parser Specification Constants',
    sidebar_label: 'Parser Specification Constants',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/src/ParserSpecification.js',
    target: 'api/file-processor/specification/ParserSpecification.md',
    id: 'ParserSpecification',
    title: 'Parser Specification',
    sidebar_label: 'Parser Specification',
  },
  {
    src:
      'node_modules/@xhubiotable/file-processor/src/ParserSpecificationConverter.js',
    target: 'api/file-processor/specification/ParserSpecificationConverter.md',
    id: 'ParserSpecificationConverter',
    title: 'Parser Specification Converter',
    sidebar_label: 'Parser Specification Converter',
  },
  // ---------------------------------------------
  // - importer xlsx
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/importer-xlsx/src/ImporterXlsx.js',
    target: 'api/importerXlsx/ImporterXlsx.md',
    id: 'ImporterXlsx',
    title: 'Importer xlsx',
    sidebar_label: 'Importer xlsx',
  },
  // ---------------------------------------------
  // - logger
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/logger/src/LoggerInterface.js',
    target: 'api/logger/LoggerInterface.md',
    id: 'LoggerInterface',
    title: 'Logger Interface',
    sidebar_label: 'Logger Interface',
  },
  {
    src: 'node_modules/@xhubiotable/logger/src/LoggerMemory.js',
    target: 'api/logger/LoggerMemory.md',
    id: 'LoggerMemory',
    title: 'Logger Memory',
    sidebar_label: 'Logger Memory',
  },
  // ---------------------------------------------
  // - model
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/model/src/TableInterface.js',
    target: 'api/model/TableInterface.md',
    id: 'TableInterface',
    title: 'Table Interface',
    sidebar_label: 'Table Interface',
  },
  {
    src: 'node_modules/@xhubiotable/model/src/TestcaseDefinitionInterface.js',
    target: 'api/model/TestcaseDefinitionInterface.md',
    id: 'TestcaseDefinitionInterface',
    title: 'Testcase Definition Interface',
    sidebar_label: 'Testcase Definition Interface',
  },
  {
    src: 'node_modules/@xhubiotable/model/src/TodoMeta.js',
    target: 'api/model/todo/TodoMeta.md',
    id: 'TodoMeta',
    title: 'Todo Meta',
    sidebar_label: 'Todo Meta',
  },
  {
    src: 'node_modules/@xhubiotable/model/src/TodoStatic.js',
    target: 'api/model/todo/TodoStatic.md',
    id: 'TodoStatic',
    title: 'Todo Static',
    sidebar_label: 'Todo Static',
  },
  {
    src: 'node_modules/@xhubiotable/model/src/TodoGenerator.js',
    target: 'api/model/todo/TodoGenerator.md',
    id: 'TodoGenerator',
    title: 'Todo Generator',
    sidebar_label: 'Todo Generator',
  },
  {
    src: 'node_modules/@xhubiotable/model/src/TodoReference.js',
    target: 'api/model/todo/TodoReference.md',
    id: 'TodoReference',
    title: 'Todo Reference',
    sidebar_label: 'Todo Reference',
  },
  // ---------------------------------------------
  // - model decision
  // ---------------------------------------------
  // Sections ------------------------------------
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/BaseSectionDefinition.js',
    target: 'api/model-decision/sections/BaseSectionDefinition.md',
    id: 'BaseSectionDefinition',
    title: 'Base Section Definition',
    sidebar_label: 'Base Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/BaseSingleRowSectionDefinition.js',
    target: 'api/model-decision/sections/BaseSingleRowSectionDefinition.md',
    id: 'BaseSingleRowSectionDefinition',
    title: 'Base Single Row Section Definition',
    sidebar_label: 'Base Single Row Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/ExecuteSectionDefinition.js',
    target: 'api/model-decision/sections/ExecuteSectionDefinition.md',
    id: 'ExecuteSectionDefinition',
    title: 'Execute Section Definition',
    sidebar_label: 'Execute Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/NeverExecuteSectionDefinition.js',
    target: 'api/model-decision/sections/NeverExecuteSectionDefinition.md',
    id: 'NeverExecuteSectionDefinition',
    title: 'Never Execute Section Definition',
    sidebar_label: 'Never Execute Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/MultiplicitySectionDefinition.js',
    target: 'api/model-decision/sections/MultiplicitySectionDefinition.md',
    id: 'MultiplicitySectionDefinition',
    title: 'Multiplicity Section Definition',
    sidebar_label: 'Multiplicity Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/SummarySectionDefinition.js',
    target: 'api/model-decision/sections/SummarySectionDefinition.md',
    id: 'SummarySectionDefinition',
    title: 'Summary Section Definition',
    sidebar_label: 'Summary Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/FieldSectionDefinition.js',
    target: 'api/model-decision/sections/FieldSectionDefinition.md',
    id: 'FieldSectionDefinition',
    title: 'Field Section Definition',
    sidebar_label: 'Field Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/FieldSubSectionDefinition.js',
    target: 'api/model-decision/sections/FieldSubSectionDefinition.md',
    id: 'FieldSubSectionDefinition',
    title: 'Field Sub Section Definition',
    sidebar_label: 'Field Sub Section Definition',
  },

  {
    src:
      'node_modules/@xhubiotable/model-decision/src/MultiRowSectionDefinition.js',
    target: 'api/model-decision/sections/MultiRowSectionDefinition.md',
    id: 'MultiRowSectionDefinition',
    title: 'Multi Row Section Definition',
    sidebar_label: 'Multi Row Section Definition',
  },
  {
    src: 'node_modules/@xhubiotable/model-decision/src/TagSectionDefinition.js',
    target: 'api/model-decision/sections/TagSectionDefinition.md',
    id: 'TagSectionDefinition',
    title: 'Tag Section Definition',
    sidebar_label: 'Tag Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/FilterSectionDefinition.js',
    target: 'api/model-decision/sections/FilterSectionDefinition.md',
    id: 'FilterSectionDefinition',
    title: 'Filter Section Definition',
    sidebar_label: 'Filter Section Definition',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/GeneratorSwitchSectionDefinition.js',
    target: 'api/model-decision/sections/GeneratorSwitchSectionDefinition.md',
    id: 'GeneratorSwitchSectionDefinition',
    title: 'Generator Switch Section Definition',
    sidebar_label: 'Generator Switch Section  Definition',
  },
  // Other ---------------------------------------
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/TestcaseDefinitionDecision.js',
    target: 'api/model-decision/TestcaseDefinitionDecision.md',
    id: 'TestcaseDefinitionDecision',
    title: 'Testcase Definition Decision',
    sidebar_label: 'Testcase Definition Decision',
  },
  {
    src: 'node_modules/@xhubiotable/model-decision/src/TableDecision.js',
    target: 'api/model-decision/TableDecision.md',
    id: 'TableDecision',
    title: 'Table Decision',
    sidebar_label: 'Table Decision',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/src/constants/sectionTypes.js',
    target: 'api/model-decision/sectionTypes.md',
    id: 'sectionTypes',
    title: 'Section Types',
    sidebar_label: 'Section Types',
  },
  // functions -----------------------------------
  {
    src: 'node_modules/@xhubiotable/model-decision/src/ValidateDouble.js',
    target: 'api/model-decision/functions/ValidateDouble.md',
    id: 'ValidateDouble',
    title: 'Validate Double',
    sidebar_label: 'Validate Double',
  },
  {
    src: 'node_modules/@xhubiotable/model-decision/src/ValidateHelper.js',
    target: 'api/model-decision/functions/ValidateHelper.md',
    id: 'ValidateHelper',
    title: 'Validate Helper',
    sidebar_label: 'Validate Helper',
  },
  {
    src: 'node_modules/@xhubiotable/model-decision/src/ValidateMissing.js',
    target: 'api/model-decision/functions/ValidateMissing.md',
    id: 'ValidateMissing',
    title: 'Validate Missing',
    sidebar_label: 'Validate Missing',
  },

  // ---------------------------------------------
  // - model matrix
  // ---------------------------------------------
  {
    src:
      'node_modules/@xhubiotable/model-matrix/src/TestcaseDefinitionMatrix.js',
    target: 'api/model-matrix/TestcaseDefinitionMatrix.md',
    id: 'TestcaseDefinitionMatrix',
    title: 'Testcase Definition Matrix',
    sidebar_label: 'Testcase Definition Matrix',
  },
  {
    src: 'node_modules/@xhubiotable/model-matrix/src/TableMatrix.js',
    target: 'api/model-matrix/TableMatrix.md',
    id: 'TableMatrix',
    title: 'Table Matrix',
    sidebar_label: 'Table Matrix',
  },

  // ---------------------------------------------
  // - processor
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/processor/src/InterfaceProcessor.js',
    target: 'api/processor/InterfaceProcessor.md',
    id: 'InterfaceProcessor',
    title: 'Interface Processor',
    sidebar_label: 'Interface Processor',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/InterfaceWriter.js',
    target: 'api/processor/InterfaceWriter.md',
    id: 'InterfaceWriter',
    title: 'Interface Writer',
    sidebar_label: 'Interface Writer',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/Node.js',
    target: 'api/processor/Node.md',
    id: 'Node',
    title: 'Node',
    sidebar_label: 'Node',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/Reference.js',
    target: 'api/processor/Reference.md',
    id: 'Reference',
    title: 'Reference',
    sidebar_label: 'Reference',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/TestcaseData.js',
    target: 'api/processor/TestcaseData.md',
    id: 'TestcaseData',
    title: 'Testcase Data',
    sidebar_label: 'Testcase Data',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/Processor.js',
    target: 'api/processor/Processor.md',
    id: 'Processor',
    title: 'Processor',
    sidebar_label: 'Processor',
  },

  // functions -----------------------------------
  {
    src: 'node_modules/@xhubiotable/processor/src/writeMetaData.js',
    target: 'api/processor/writeMetaData.md',
    id: 'writeMetaData',
    title: 'writeMetaData',
    sidebar_label: 'writeMetaData',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/writeStaticData.js',
    target: 'api/processor/writeStaticData.md',
    id: 'writeStaticData',
    title: 'writeStaticData',
    sidebar_label: 'writeStaticData',
  },
  {
    src: 'node_modules/@xhubiotable/processor/src/utilCartesian.js',
    target: 'api/processor/utilCartesian.md',
    id: 'utilCartesian',
    title: 'utilCartesian',
    sidebar_label: 'utilCartesian',
  },

  // filter --------------------------------------
  {
    src:
      'node_modules/@xhubiotable/processor/src/filter/FilterProcessorInterface.js',
    target: 'api/processor/filter/FilterProcessorInterface.md',
    id: 'FilterProcessorInterface',
    title: 'Interface Filter',
    sidebar_label: 'Interface Filter',
  },
  {
    src:
      'node_modules/@xhubiotable/processor/src/filter/SimpleArrayFilterProcessor.js',
    target: 'api/processor/filter/SimpleArrayFilterProcessor.md',
    id: 'SimpleArrayFilterProcessor',
    title: 'Simple Array Filter',
    sidebar_label: 'Simple Array Filter',
  },
  {
    src:
      'node_modules/@xhubiotable/processor/src/filter/SimpleArrayIgnoreFilterProcessor.js',
    target: 'api/processor/filter/SimpleArrayIgnoreFilterProcessor.md',
    id: 'SimpleArrayIgnoreFilterProcessor',
    title: 'Simple Array Ignore Filter',
    sidebar_label: 'Simple Array Ignore Filter',
  },
]

/**
 * First create the mardown file
 * @param srcFileName {string} The docbook source file to be converted
 * @param targetFileName {string} The mardown result file name
 */
async function createMarkdown(srcFileName, targetFileName) {
  const targetPath = path.dirname(targetFileName)
  await md(targetPath)

  return new Promise((resolve, reject) => {
    exec(
      `npx jsdoc2md -c jsdoc.config.json ${srcFileName} > ${targetFileName}`,
      (error, stdout, stderr) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.log('ERROR create markdown:', error)
          reject(error.code)
        }
        if (stderr) {
          reject(stderr)
        }
        resolve(stdout)
      }
    )
  })
}

async function run(inputArray) {
  for (const fileObj of inputArray) {
    const src = path.join(__dirname, '..', fileObj.src)
    const target = path.join(DOC_PATH, fileObj.target)

    // eslint-disable-next-line no-console
    console.log('-------------------------------------------------')
    // eslint-disable-next-line no-console
    console.log(`Work on file: ${src}`)

    try {
      await createMarkdown(src, target)
      await modifyMarkdown({
        srcFile: target,
        targetFile: target,
        headerInfo: {
          id: fileObj.id,
          title: fileObj.title,
          sidebar_label: fileObj.sidebar_label,
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e)
    }
  }
}

console.log('------------------------------')
console.log('- Importand ')
console.log('- Works only if the xhubiotable projects are linked ')
console.log('------------------------------')

run(INPUT)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Done creating API documentation.')
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
