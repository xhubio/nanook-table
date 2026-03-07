import fs from 'node:fs/promises'
import path from 'node:path'
import { TableDecisionInterface } from '../interface/TableDecisionInterface.js'

export function serializeTableDecision(table: TableDecisionInterface) {
  const fileName = table.fileName
  const tableName = table.tableName

  const testcaseOrder = table.testcaseOrder
  const sectionOrder = table.sectionOrder
  const testcases: Record<string, any> = {} // eslint-disable-line @typescript-eslint/no-explicit-any
  const sections = table.sections

  for (const tcName of Object.keys(table.testcases)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testcase = table.testcases[tcName].clone() as any
    delete testcase.table
    delete testcase.logger
    delete testcase.tableMeta
    testcases[tcName] = testcase
  }

  return {
    fileName,
    tableName,
    testcaseOrder,
    sectionOrder,
    testcases,
    sections
  }
}

export async function serializeTableDecisionToFile(
  table: TableDecisionInterface,
  fileName: string
) {
  const dir = path.dirname(fileName)
  await fs.mkdir(dir, { recursive: true })
  const contentJson = serializeTableDecision(table)
  await fs.writeFile(fileName, JSON.stringify(contentJson, null, 2))
}
