import fs from 'fs'
import util from 'util'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

/**
 * Inserts the header and update the image includes
 * @param srcFile {string} The unmodified markdown file
 * @param targetFile {string} The path for the modified result file
 * @param headerInfo {object} The values to be inserted into the header
 */
export async function modifyMarkdown({ srcFile, targetFile, headerInfo }) {
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
