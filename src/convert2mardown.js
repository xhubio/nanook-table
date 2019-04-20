import fs from 'fs'
import util from 'util'
import path from 'path'
import { exec } from 'child_process'
import mkdirp from 'mkdirp'
import globby from 'globby'

const md = util.promisify(mkdirp)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const copyFile = util.promisify(fs.copyFile)

const websiteRepoPath =
  '/Users/torstenlink/Documents/entwicklung/nanook/nanook-website'
const WEBSITE_IMAGES = path.join(websiteRepoPath, 'website', 'static', 'img')
const docPath = path.join(websiteRepoPath, 'docs')
const SOURCE_IMAGES = 'build/images'

const INPUT = [
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
  //   { src: '', id: 'guide/equivalence/overview', title: '', sidebar_label: '' },
  //   { src: '', id: 'guide/equivalence/sections', title: '', sidebar_label: '' },
  //
  //   { src: '', id: 'guide/matrix/overview', title: '', sidebar_label: '' },
  //
  //   { src: '', id: 'guide/advanced/references', title: '', sidebar_label: '' },
  //   { src: '', id: 'guide/advanced/instanceIds', title: '', sidebar_label: '' },
  //
  //   { src: '', id: 'api/overview', title: '', sidebar_label: '' },
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

/**
 * Inserts the header and update the image includes
 * @param srcFile {string} The unmodified markdown file
 * @param targetFile {string} The path for the modified result file
 * @param headerInfo {object} The values to be inserted into the header
 */
async function modifyMarkdown({ srcFile, targetFile, headerInfo }) {
  let content = await readFile(srcFile, 'utf-8')
  content = content.replace(/images\//g, '/img/')
  content = content.replace(/^# .*\n/, '')
  const newContent = []

  // if the first line starts with a title, the title needs to be removed

  newContent.push('---')
  newContent.push(`id: ${headerInfo.id}`)
  newContent.push(`title: ${headerInfo.title}`)
  newContent.push(`sidebar_label: ${headerInfo.sidebar_label}`)
  newContent.push('---')
  newContent.push('')
  newContent.push(content)

  await writeFile(targetFile, newContent.join('\n'))
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

    console.log('-------------------------------------------------')
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
      console.log(e)
    }
  }
}

// /**
//  * Copies the images from this repo into the images folder of the wibsite repo
//  *
//  */
// function copyImages() {}
//
// function insertHeader() {}
//
// /**
//  * The image path in the documents must be updated to work
//  * with docusaurus
//  */
// function replaceImagePath() {}
//

run(INPUT)
  .then(() => {
    console.log('DOOONE')
  })
  .catch(err => {
    console.log(err)
  })
