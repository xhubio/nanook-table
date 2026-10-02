/**
 * Checks a workbook of Nanook decision tables independently of the script that built it.
 *
 *  - reads the markers from the cells (not the cached formula results)
 *  - recomputes combinations, column products, sum and coverage per sheet
 *  - reports every equivalence class without an `x` of its own (`a`/`e` are a choice, not a guarantee)
 *  - reports every column in which a field has no marker at all
 *
 * Usage:  node scripts/check-classes.mts resources/<name>-tests.xlsx
 * Exit 1 if a sheet is below 100 %, a class has no `x`, or the file holds no decision table.
 * Needs `exceljs` in the project (npm install -D exceljs).
 */
import path from 'node:path'
import ExcelJS from 'exceljs'

const FIRST_TC_COL = 6 // column F
const KNOWN_MARKERS = new Set(['', 'x', 'a', 'e', 'i'])

function plain(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if ('formula' in value) return plain((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue)
    if ('richText' in value) return (value as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('')
    if ('text' in value) return String((value as ExcelJS.CellHyperlinkValue).text)
    return ''
  }
  return String(value).trim()
}

interface ClassInfo {
  name: string
  markers: string[] // one per test case
}
interface FieldInfo {
  name: string
  classes: ClassInfo[]
}
interface SheetInfo {
  tcs: string[]
  fields: FieldInfo[]
}

function readSheet(ws: ExcelJS.Worksheet): SheetInfo | undefined {
  if (plain(ws.getCell(1, 1).value) !== '<DECISION_TABLE>') return undefined

  const tcs: string[] = []
  for (let c = FIRST_TC_COL; ; c++) {
    const name = plain(ws.getCell(1, c).value)
    if (name === '') break
    tcs.push(name)
  }

  const fields: FieldInfo[] = []
  let current: FieldInfo | undefined
  for (let r = 2; r <= ws.rowCount; r++) {
    const a = plain(ws.getCell(r, 1).value)
    const b = plain(ws.getCell(r, 2).value)
    const c = plain(ws.getCell(r, 3).value)
    if (a === '<END>') break
    if (b === 'FieldSubSection') {
      current = { name: a, classes: [] }
      fields.push(current)
      continue
    }
    if (b !== '') {
      current = undefined // another section (FieldSection, Summary, MultiRow, Tag, ...)
      continue
    }
    if (current !== undefined && c !== '') {
      current.classes.push({
        name: c,
        markers: tcs.map((_, i) => plain(ws.getCell(r, FIRST_TC_COL + i).value).toLowerCase())
      })
    }
  }
  return { tcs, fields }
}

function checkSheet(name: string, sheet: SheetInfo): boolean {
  const { tcs, fields } = sheet
  const problems: string[] = []

  const total = fields.reduce((acc, f) => acc * f.classes.length, 1)
  const products = tcs.map((_, i) =>
    fields.reduce((acc, f) => acc * f.classes.filter((cl) => cl.markers[i] !== '').length, 1)
  )
  const sum = products.reduce((a, b) => a + b, 0)

  for (const f of fields) {
    for (const cl of f.classes) {
      if (!cl.markers.some((m) => m === 'x')) problems.push(`class without its own 'x': ${f.name}.${cl.name}`)
      cl.markers.forEach((m, i) => {
        if (!KNOWN_MARKERS.has(m)) problems.push(`unknown marker '${m}' in ${tcs[i]} / ${f.name}.${cl.name}`)
      })
    }
  }
  tcs.forEach((tc, i) => {
    for (const f of fields) {
      if (f.classes.every((cl) => cl.markers[i] === '')) problems.push(`column '${tc}': field '${f.name}' has no marker`)
    }
  })
  if (sum !== total) problems.push(`coverage ${sum}/${total}, expected ${total}`)

  console.log(`\n${name}: ${fields.length} fields, ${tcs.length} columns`)
  console.log(`  combinations: ${fields.map((f) => f.classes.length).join(' × ')} = ${total}`)
  tcs.forEach((tc, i) => console.log(`  ${tc.padEnd(24)} ${String(products[i]).padStart(6)}`))
  console.log(`  ${'sum'.padEnd(24)} ${String(sum).padStart(6)}   = ${((100 * sum) / total).toFixed(2)} %`)
  for (const p of problems) console.log(`  PROBLEM: ${p}`)
  return problems.length === 0
}

async function main() {
  if (!process.argv[2]) {
    console.error('usage: node scripts/check-classes.mts <workbook.xlsx>')
    process.exit(1)
  }
  const file = path.resolve(process.argv[2])

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(file)

  let ok = true
  let count = 0
  for (const ws of workbook.worksheets) {
    const sheet = readSheet(ws)
    if (sheet === undefined) continue
    count++
    if (!checkSheet(ws.name, sheet)) ok = false
  }

  if (count === 0) {
    console.error(`no decision table found in ${file}`)
    process.exit(1)
  }
  console.log(ok ? '\nAll sheets: 100 % coverage, every class has its own x.' : '\nCheck failed.')
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
