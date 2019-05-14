import fs from 'fs'
import util from 'util'
import path from 'path'
import { exec } from 'child_process'
import mkdirp from 'mkdirp'
import globby from 'globby'

import { modifyMarkdown } from './insertHeaderInMarkdown'

const md = util.promisify(mkdirp)
const copyFile = util.promisify(fs.copyFile)

const websiteRepoPath =
  '/Users/torstenlink/Documents/entwicklung/nanook/nanook-website'
const WEBSITE_IMAGES = path.join(websiteRepoPath, 'website', 'static', 'img')
const docPath = path.join(websiteRepoPath, 'docs')
const SOURCE_IMAGES = 'build/images'

/**
 * {
 *   // The soure adoc file
 *   src: 'doc/tutorials/introduction.adoc',
 *
 *   // The name of the docbok xml to be created
 *   docbook: 'build/tutorial/overview.xml',
 *
 *   // The path in the docs director of the wibsite repository
 *   target: 'tutorials/overview.md',
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
  // - Quickstart
  // ---------------------------------------------
  {
    src: 'doc/Quickstart.adoc',
    docbook: 'build/quickstart/quickstart.xml',
    target: 'quickstart/quickstart.md',
    id: 'quickstart',
    title: 'Quickstart',
    sidebar_label: 'Quickstart',
  },
  // ---------------------------------------------
  // - Tutorial
  // ---------------------------------------------
  {
    src: 'doc/tutorials/introduction.adoc',
    docbook: 'build/tutorial/overview.xml',
    target: 'tutorials/overview.md',
    id: 'overview',
    title: 'Overview',
    sidebar_label: 'Overview',
  },
  {
    src: 'doc/tutorials/t1_equivalenceTableFromScratch/index.adoc',
    docbook: 'build/tutorial/createEquivalenceClassTable.xml',
    target: 'tutorials/createEquivalenceClassTable.md',
    id: 'createEquivalenceClassTable',
    title: 'Create an equivalence class tables from scratch',
    sidebar_label: 'Create an equivalence class table',
  },
  {
    src: 'doc/tutorials/t2_transformToDataGeneration/index.adoc',
    docbook: 'build/tutorial/transform2dataGenerator.xml',
    target: 'tutorials/transform2dataGenerator.md',
    id: 'transform2dataGenerator',
    title: 'Transform the table to a data generator',
    sidebar_label: 'Transform to data generator',
  },

  //   {
  //     src: 'doc/tutorials//index.adoc',
  //     id: 'tutorials/introduceSections',
  //     title: '',
  //     sidebar_label: '',
  //   },

  {
    src: 'doc/tutorials/t2_a_createDataGenerator/step4.adoc',
    docbook: 'build/tutorial/createGenerator.xml',
    target: 'tutorials/createGenerator.md',
    id: 'createGenerator',
    title: 'Create your own data generator',
    sidebar_label: 'Create data generator',
  },

  //   {
  //     src: 'doc/tutorials//index.adoc',
  //     id: 'tutorials/createGenerator',
  //     title: '',
  //     sidebar_label: '',
  //   },
  {
    src: 'doc/tutorials/t4_createWriter/index.adoc',
    docbook: 'build/tutorial/createWriter.xml',
    target: 'tutorials/createWriter.md',
    id: 'createWriter',
    title: 'Create your own writer',
    sidebar_label: 'Create writer',
  },

  //   {
  //     src: 'doc/tutorials//index.adoc',
  //     id: 'tutorials/createFilterProcessor',
  //     title: '',
  //     sidebar_label: '',
  //   },
  //

  // ---------------------------------------------
  // - Guide
  // ---------------------------------------------
  {
    src: 'doc/Overview.adoc',
    docbook: 'build/guide/generalOverview.xml',
    target: 'guide/generalOverview.md',
    id: 'generalOverview',
    title: 'Overview of Nanook-Table',
    sidebar_label: 'Nanook-Table Overview',
  },

  {
    src:
      'node_modules/@xhubiotable/model-decision/doc/equivalence_class_table_layout.adoc',
    docbook: 'build/guide/equivalence/equivalence_class_table_layout.xml',
    target: 'guide/equivalence/overview.md',
    id: 'overview',
    title: 'Decision table overview',
    sidebar_label: 'Overview',
  },
  {
    src:
      'node_modules/@xhubiotable/model-decision/doc/equivalence_class_table_sections.adoc',
    docbook: 'build/guide/equivalence/equivalence_class_table_sections.xml',
    target: 'guide/equivalence/sections.md',
    id: 'sections',
    title: 'Decision table sections',
    sidebar_label: 'Section',
  },

  {
    src: 'node_modules/@xhubiotable/model-matrix/doc/matrix_table.adoc',
    docbook: 'build/guide/matrix/equivalence_class_table_layout.xml',
    target: 'guide/matrix/overview.md',
    id: 'overview',
    title: 'Matrix table overview',
    sidebar_label: 'Overview',
  },

  // ---------------------------------------------
  // - Guide Generator Command
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/processor/doc/staticData.adoc',
    docbook: 'build/guide/generatorCommand/staticData.xml',
    target: 'guide/generatrorCommand/staticData.md',
    id: 'static',
    title: 'Static Data',
    sidebar_label: 'Static Data',
  },
  {
    src: 'node_modules/@xhubiotable/processor/doc/generatorCommand.adoc',
    docbook: 'build/guide/generatorCommand/generator.xml',
    target: 'guide/generatrorCommand/generator.md',
    id: 'generator',
    title: 'Generator commands',
    sidebar_label: 'Generator',
  },
  {
    src: 'node_modules/@xhubiotable/processor/doc/referenceOverview.adoc',
    docbook: 'build/guide/generatorCommand/reference.xml',
    target: 'guide/generatrorCommand/reference.md',
    id: 'reference',
    title: 'References',
    sidebar_label: 'References',
  },

  // ---------------------------------------------
  // - Guide Advanced
  // ---------------------------------------------

  //
  //   { src: '', id: 'guide/advanced/references', title: '', sidebar_label: '' },
  //   { src: '', id: 'guide/advanced/instanceIds', title: '', sidebar_label: '' },
  //
  //   { src: '', id: 'api/overview', title: '', sidebar_label: '' },

  // ---------------------------------------------
  // - Modules
  // ---------------------------------------------
  {
    src: 'node_modules/@xhubiotable/model/doc/index.adoc',
    docbook: 'build/modules/model.xml',
    target: 'modules/model.md',
    id: 'model',
    title: 'Model',
    sidebar_label: 'Model',
  },
  {
    src: 'node_modules/@xhubiotable/logger/doc/index.adoc',
    docbook: 'build/modules/logger.xml',
    target: 'modules/logger.md',
    id: 'logger',
    title: 'Logger',
    sidebar_label: 'Logger',
  },
  {
    src: 'node_modules/@xhubiotable/file-processor/doc/index.adoc',
    docbook: 'build/modules/fileProcessor.xml',
    target: 'modules/fileProcessor.md',
    id: 'fileProcessor',
    title: 'File Processor',
    sidebar_label: 'File Processor',
  },
  {
    src: 'node_modules/@xhubiotable/data-generator/doc/index.adoc',
    docbook: 'build/modules/dataGenerator.xml',
    target: 'modules/dataGenerator.md',
    id: 'dataGenerator',
    title: 'Data Generator',
    sidebar_label: 'Data Generator',
  },
  {
    src: 'node_modules/@xhubiotable/processor/doc/writer.adoc',
    docbook: 'build/modules/writer.xml',
    target: 'modules/writer.md',
    id: 'writer',
    title: 'Writer',
    sidebar_label: 'Writer',
  },
]

/**
 * first create the docbook files
 * @param srcFileName {string} The asciidoc source file to be converted
 * @param targetFileName {string} The docbook result file name
 */
async function createDocbook(srcFileName, targetFileName) {
  const targetPath = path.dirname(targetFileName)
  await md(targetPath)

  return new Promise((resolve, reject) => {
    exec(
      `asciidoctor -b docbook -a leveloffset=+1 -o ${targetFileName} ${srcFileName}`,
      (error, stdout, stderr) => {
        if (stderr) {
          reject(stderr)
        } else if (error) {
          // eslint-disable-next-line no-console
          console.log('ERROR Dockbook:', error)
          reject(error.code)
        } else {
          resolve(stdout)
        }
      }
    )
  })
}

/**
 * copies all the imgaes from the build directory into the website repo image
 * directory
 * @param sourceDir {string} The directory to search for images
 * @param targetDir {string} The target image directory
 */
async function copyImages(sourceDir, targetDir) {
  const images = await globby([
    path.join(sourceDir, '**/*.jpg'),
    path.join(sourceDir, '**/*.png'),
    path.join(sourceDir, '**/*.svg'),
  ])

  for (const img of images) {
    const sourceRelative = path.relative(sourceDir, img)
    const target = path.join(targetDir, sourceRelative)
    const subTargetDir = path.dirname(target)
    await md(subTargetDir)
    await copyFile(img, target)
  }
}

/**
 * first create the docbook files
 * @param srcFileName {string} The docbook source file to be converted
 * @param targetFileName {string} The mardown result file name
 */
async function convert2Markdown(srcFileName, targetFileName) {
  const targetPath = path.dirname(targetFileName)
  await md(targetPath)

  return new Promise((resolve, reject) => {
    exec(
      `pandoc  --atx-headers --wrap=preserve -t gfm -f docbook ${srcFileName} > ${targetFileName}`,
      (error, stdout, stderr) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.log('ERROR consvert:', error)
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
  // copy all the copyImages
  await copyImages(SOURCE_IMAGES, WEBSITE_IMAGES)

  for (const fileObj of inputArray) {
    const src = path.join(__dirname, '..', fileObj.src)
    const docbook = path.join(__dirname, '..', fileObj.docbook)
    const dockbookDir = path.dirname(docbook)
    const dockbookFilenameOnly = path.basename(docbook, '.xml')
    const markdown = path.join(dockbookDir, `${dockbookFilenameOnly}.md`)
    const target = path.join(docPath, fileObj.target)

    // eslint-disable-next-line no-console
    console.log('-------------------------------------------------')
    // eslint-disable-next-line no-console
    console.log(`Work on file: ${src}`)

    try {
      await createDocbook(src, docbook)
      await convert2Markdown(docbook, markdown)
      await modifyMarkdown({
        srcFile: markdown,
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

run(INPUT)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Done converting the asciidoc files to markdown.')
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
