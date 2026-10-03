/**
 * Reads a workbook with Nanook's own parser and reports what a generator run will need,
 * before anything is generated.
 *
 *  - every table: type, test-case columns, Execute / NeverExecute / Multiplicity
 *  - the minimum number of fixtures per table (executed columns times multiplicity, without the
 *    columns that reference a NeverExecute test case); a column with a range reference is marked
 *    `+range`, it yields one fixture per element of the range
 *  - every gen: directive grouped by generator; a generator that generate-fixtures.mts does not
 *    register, a faker path faker does not have and an unknown text instruction are errors
 *  - every ref: directive; a missing target table, field or test case is an error in an executed
 *    column and a warning in any other; a target with NeverExecute is a warning (Nanook drops the
 *    whole test case)
 *  - every FilterSection row a column uses; such a column is marked `filter` and not counted in
 *    the minimum (the filter decides at run time); a filter processor generate-fixtures.mts does
 *    not register is an error
 *  - every error the loader logged
 *
 * Usage:  node scripts/inspect-workbook.mts resources/<name>-tests.xlsx
 * The registered generators and filter processors are read from generate-fixtures.mts next to
 * this script.
 * Exit 1 on an unknown generator or filter processor, a broken reference, a load error or no
 * table at all.
 */
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  LoggerMemory,
  GeneratorFaker,
  DataGeneratorRegistry,
  FieldSectionDefinition,
  TableDecision,
  createDefaultFileProcessor
} from '@xhubio/nanook-table'
import type { GeneratorDirectiveInterface } from '@xhubio/nanook-table'

if (!process.argv[2]) {
  console.error('usage: node scripts/inspect-workbook.mts <workbook.xlsx>')
  process.exit(1)
}
const XLSX_FILE = path.resolve(process.argv[2])
const FIXTURE_SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'generate-fixtures.mts')
const TEXT_INSTRUCTION = /^(empty|spaces:\d+|alpha:\d+|email:\d+)$/

interface Field {
  name: string
  // row id -> content of the generator column
  tdgs: Record<string, string>
}

const errors: string[] = []
const warnings: string[] = []

async function registeredInFixtureScript(): Promise<{ generators: string[]; filters: string[] }> {
  try {
    const source = await fs.readFile(FIXTURE_SCRIPT, 'utf8')
    return {
      generators: [...source.matchAll(/registerGenerator\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
      filters: [...source.matchAll(/addFilterProcessor\(\s*new\s+\w+\(\s*\{\s*name:\s*['"]([^'"]+)['"]/g)].map(
        (m) => m[1]
      )
    }
  } catch {
    warnings.push(`${path.basename(FIXTURE_SCRIPT)} not found next to this script, assuming its defaults`)
    return { generators: ['faker', 'text'], filters: ['SimpleArrayFilter', 'SimpleArrayIgnoreFilter'] }
  }
}

function fieldsOf(table: TableDecision): Field[] {
  const fields: Field[] = []
  for (const sectionId of table.sectionOrder) {
    const section = table.sections[sectionId]
    if (!(section instanceof FieldSectionDefinition)) continue
    for (const sub of Object.values(section.subSections)) {
      if (sub.name !== undefined) fields.push({ name: sub.name, tdgs: sub.tdgs })
    }
  }
  return fields
}

// the cells a test-case column can pick for a field, as Nanook picks them:
// x/a win over any other marker, '' and i are never picked, one of the rest at random
function usedCells(field: Field, data: Record<string, string>): string[] {
  const preferred: string[] = []
  const others: string[] = []
  for (const [rowId, tdg] of Object.entries(field.tdgs)) {
    const marker = (data[rowId] ?? '').toLowerCase()
    if (marker === '' || marker === 'i' || !tdg) continue
    if (marker === 'x' || marker === 'a') preferred.push(tdg)
    else others.push(tdg)
  }
  return preferred.length > 0 ? preferred : others
}

const fakerLogger = new LoggerMemory()
const fakerRegistry = new DataGeneratorRegistry()
const faker = new GeneratorFaker({ generatorRegistry: fakerRegistry, name: 'faker', logger: fakerLogger })

async function fakerPathExists(config: string): Promise<boolean> {
  try {
    const value = await faker.generate({
      instanceId: `inspect:${config}`,
      testcaseData: { name: 'inspect' },
      generatorDirective: { config } as GeneratorDirectiveInterface
    })
    return value !== undefined
  } catch {
    return false
  }
}

async function main() {
  const logger = new LoggerMemory()
  // the default level is 'error'; keep the loader's warnings (e.g. a sheet name used twice) too
  logger.level = 'warning'
  const fileProcessor = createDefaultFileProcessor(logger)
  await fileProcessor.load([XLSX_FILE])
  const tables = fileProcessor.tables
  if (tables.length === 0) errors.push(`no table loaded from ${XLSX_FILE}`)

  const { generators: registered, filters: registeredFilters } = await registeredInFixtureScript()
  const decisionTables: Record<string, TableDecision> = {}
  for (const table of tables) {
    if (table instanceof TableDecision) decisionTables[table.tableName] = table
  }

  // generator name -> directive -> where it is used
  const generators: Record<string, Record<string, Set<string>>> = {}
  let minimum = 0

  console.log(`workbook: ${path.relative(process.cwd(), XLSX_FILE)}`)
  console.log(`registered in ${path.basename(FIXTURE_SCRIPT)}:`)
  console.log(`  generators: ${registered.join(', ') || 'none'}`)
  console.log(`  filter processors: ${registeredFilters.join(', ') || 'none'}\n`)

  for (const table of tables) {
    if (!(table instanceof TableDecision)) {
      console.log(`${table.tableName} [${table.tableType}] not inspected, only decision tables are`)
      continue
    }
    const fields = fieldsOf(table)
    const testcases = table.testcaseOrder.map((id) => table.testcases[id])
    const executed = testcases.filter((tc) => tc.execute)
    let tableMinimum = 0
    const lines: string[] = []

    for (const tc of testcases) {
      const flags = [
        tc.execute ? 'execute' : 'no execute',
        tc.neverExecute ? 'NeverExecute' : '',
        tc.multiplicity > 1 ? `x${tc.multiplicity}` : ''
      ].filter(Boolean)
      let fansOut = false
      let dropped = false

      for (const field of fields) {
        for (const cell of usedCells(field, tc.data)) {
          const where = `${table.tableName}.${tc.testcaseName}.${field.name}`
          const lower = cell.toLowerCase()
          if (lower.startsWith('gen:')) {
            const name = cell.split(':')[2] ?? ''
            generators[name] ??= {}
            generators[name][cell] ??= new Set()
            generators[name][cell].add(where)
          } else if (lower.startsWith('ref:')) {
            // a column that is not executed only matters when another column references it
            const report = tc.execute ? errors : warnings
            const [, suffix = '', targetTableName = '', targetField = '', targetTc = ''] = cell.split(':')
            const targetTable = decisionTables[targetTableName || table.tableName]
            if (targetTable === undefined) {
              report.push(`${where}: '${cell}' points to table '${targetTableName}', which is not in this workbook`)
              continue
            }
            // without a field name the reference takes the whole record
            if (targetField !== '' && !fieldsOf(targetTable).some((f) => f.name === targetField)) {
              report.push(`${where}: '${cell}' points to field '${targetField}', which table '${targetTable.tableName}' does not have`)
            }
            if (targetTc === '') continue
            const names = targetTable.processRanges(targetTc)
            if (names.length > 1) {
              fansOut = true
              if (suffix !== '') report.push(`${where}: '${cell}' combines a range with an instance id suffix`)
            }
            const targetTcs = Object.values(targetTable.testcases)
            for (const name of names) {
              const target = targetTcs.find((t) => t.testcaseName === name)
              if (target === undefined) {
                report.push(`${where}: '${cell}' points to test case '${name}', which table '${targetTable.tableName}' does not have`)
              } else if (target.neverExecute && tc.execute) {
                if (names.length === 1) dropped = true
                warnings.push(`${where}: '${cell}' points to '${name}' with NeverExecute, Nanook drops that test case`)
              }
            }
          }
        }
      }

      // only the filters of the executed column count, those of referenced columns are not run
      const filters = tc.execute ? tc.createFilter() : []
      for (const filter of filters) {
        if (!registeredFilters.includes(filter.filterProcessorName)) {
          errors.push(
            `${table.tableName}.${tc.testcaseName}: filter processor '${filter.filterProcessorName}' is not registered in ${path.basename(FIXTURE_SCRIPT)}`
          )
        }
      }

      if (tc.execute && !dropped && filters.length === 0) tableMinimum += tc.multiplicity
      if (fansOut) flags.push('+range')
      if (tc.execute && dropped) flags.push('dropped')
      if (filters.length > 0) {
        flags.push(`filter ${filters.map((f) => `${f.filterProcessorName}(${f.expression})`).join(' and ')}`)
      }
      lines.push(`  ${tc.testcaseName}: ${flags.join(', ')}`)
    }

    minimum += tableMinimum
    console.log(`${table.tableName}: ${testcases.length} column(s), ${executed.length} executed, at least ${tableMinimum} fixture(s)`)
    for (const line of lines) console.log(line)
  }

  console.log('\ngenerators:')
  for (const [name, directives] of Object.entries(generators)) {
    const known = registered.includes(name)
    console.log(`  ${name}${known ? '' : '   NOT REGISTERED'}`)
    for (const [directive, uses] of Object.entries(directives)) {
      console.log(`    ${directive}   (${uses.size}x)`)
      const config = directive.split(':').slice(3).join(':')
      const first = [...uses][0]
      if (name === 'faker' && !(await fakerPathExists(config))) {
        errors.push(`${first}: '${directive}' is no faker function (a path like person.firstName, no arguments)`)
      }
      if (name === 'text' && known && !TEXT_INSTRUCTION.test(config)) {
        errors.push(`${first}: '${directive}' is no text instruction (empty, spaces:N, alpha:N, email:N)`)
      }
    }
    if (!known) {
      errors.push(`generator '${name}' is used in ${[...Object.values(directives)].reduce((n, s) => n + s.size, 0)} cell(s) but not registered in ${path.basename(FIXTURE_SCRIPT)}`)
    }
  }
  if (Object.keys(generators).length === 0) console.log('  none')

  for (const entry of logger.entries.error) errors.push(`loader: ${JSON.stringify(entry)}`)
  for (const entry of logger.entries.warning) warnings.push(`loader: ${JSON.stringify(entry)}`)

  console.log(
    `\nexpected: at least ${minimum} fixture(s), more for columns marked +range, between 0 and all for columns marked filter`
  )
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`)
    for (const w of warnings) console.log(`  ${w}`)
  }
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):`)
    for (const e of errors) console.error(`  ${e}`)
    process.exit(1)
  }
  console.log('\nno errors')
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err)
  process.exit(1)
})
