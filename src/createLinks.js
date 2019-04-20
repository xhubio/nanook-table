import fs from 'fs'
import util from 'util'
import path from 'path'
import mkdirp from 'mkdirp'

const symLink = util.promisify(fs.symlink)
const lstat = util.promisify(fs.lstat)
const md = util.promisify(mkdirp)

/**
 * Creates all the links needed. The documentation is diveded in many smaler
 * parts. To create the over all doc the images needs to be linked to the
 * main image directory
 */

const linkArray = [
  [
    'node_modules/@xhubiotable/model-decision/doc/images/model-decision',
    'doc/tutorials/t2_transformToDataGeneration/images/model-decision',
  ],
  [
    'node_modules/@xhubiotable/model-decision/doc/images/model-decision',
    'doc/images/model-decision',
  ],
  [
    'node_modules/@xhubiotable/model-matrix/doc/images/model-matrix',
    'doc/images/model-matrix',
  ],
  [
    'node_modules/@xhubiotable/data-generator/doc/images/data-generator',
    'doc/images/data-generator',
  ],
  [
    'node_modules/@xhubiotable/processor/doc/images/processor',
    'doc/images/processor',
  ],

  [
    'doc/tutorials/t1_equivalenceTableFromScratch/images/tutorials/t1',
    'doc/images/tutorials/t1',
  ],
  [
    'doc/tutorials/t2_transformToDataGeneration/images/tutorials/t2',
    'doc/images/tutorials/t2',
  ],
  [
    'doc/tutorials/t3_advancedFeatures/images/tutorials/t3',
    'doc/images/tutorials/t3',
  ],
  ['doc/images', 'build/images'],
]

async function createLinks() {
  await md(path.join(__dirname, '..', 'build'))

  for (const ln of linkArray) {
    const source = path.join(__dirname, '..', ln[0])
    const target = path.join(__dirname, '..', ln[1])
    const targetDirname = path.dirname(target)
    await md(targetDirname)

    try {
      const stats = await lstat(ln[1])
      if (stats.isSymbolicLink()) {
        // eslint-disable-next-line no-console
        console.log(`The link '${ln[1]}' already exists`)
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `Error creating link '${
            ln[1]
          }'. There is alraedy a file with this name`
        )
      }
    } catch (e) {
      await symLink(source, ln[1], 'dir')
      // eslint-disable-next-line no-console
      console.log(`Create the link '${ln[1]}' -> '${source}'`)
    }
  }
}

createLinks()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Created the links')
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
