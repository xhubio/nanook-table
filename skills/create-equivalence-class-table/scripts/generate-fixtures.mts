/**
 * Lets Nanook read a workbook and writes one JSON fixture per generated test case.
 *
 * Usage:  node scripts/generate-fixtures.mts resources/<name>-tests.xlsx [fixtures/<name>]
 *
 * Generators registered:
 *   faker   gen:<id>:faker:<module>.<function>   e.g. gen:1:faker:internet.email (a path, no arguments)
 *   text    gen::text:empty | spaces:N | alpha:N | email:N
 * Register your own generators below if the table calls others.
 *
 * Nanook does not throw on a failed generator or an unresolved reference; it logs and goes on,
 * and the test case is missing. So the logger is checked after the run: exit 1 on any error.
 * Compare the count per table with the number of test-case columns (plus one per extra element
 * of a range reference).
 */
import path from 'node:path'
import fs from 'node:fs/promises'
import {
  LoggerMemory,
  TestcaseProcessor,
  GeneratorFaker,
  DataGeneratorBase,
  DataGeneratorRegistry,
  createDefaultFileProcessor
} from '@xhubio/nanook-table'
import type {
  InterfaceWriter,
  TestcaseDataInterface,
  DataGeneratorGenerateRequest,
  TableInterface
} from '@xhubio/nanook-table'

if (!process.argv[2]) {
  console.error('usage: node scripts/generate-fixtures.mts <workbook.xlsx> [out-dir]')
  process.exit(1)
}
const XLSX_FILE = path.resolve(process.argv[2])
const OUT_DIR = path.resolve(
  process.argv[3] ?? path.join('fixtures', path.basename(XLSX_FILE, '.xlsx').replace(/-tests$/, ''))
)

// ------------------------------------------------------------------
// Generator 'text': edge cases faker cannot produce without arguments
// ------------------------------------------------------------------

function randomAlpha(n: number): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let s = ''
  for (let i = 0; i < n; i++) s += letters[Math.floor(Math.random() * letters.length)]
  return s
}

class GeneratorText extends DataGeneratorBase {
  protected doGenerate(request: DataGeneratorGenerateRequest): Promise<string> {
    const config = request.generatorDirective?.config ?? ''
    const [kind, arg] = config.split(':')
    const n = Number.parseInt(arg ?? '0', 10)
    switch (kind) {
      case 'empty':
        return Promise.resolve('')
      case 'spaces':
        return Promise.resolve(' '.repeat(n))
      case 'alpha':
        return Promise.resolve(randomAlpha(n))
      case 'email':
        return Promise.resolve(`${randomAlpha(n)}@example.com`)
      default:
        return Promise.reject(new Error(`generator 'text': unknown instruction '${config}'`))
    }
  }
}

// ------------------------------------------------------------------
// Writer: one JSON per test case. Inline on purpose: in 3.0.1 the default
// writer throws in before().
// ------------------------------------------------------------------

class FixtureWriter implements InterfaceWriter {
  logger: LoggerMemory
  written: TestcaseDataInterface[] = []

  constructor(logger: LoggerMemory) {
    this.logger = logger
  }

  async before(): Promise<void> {
    await fs.mkdir(OUT_DIR, { recursive: true })
    // remove only our own output, keep the directory
    for (const entry of await fs.readdir(OUT_DIR)) {
      if (entry.endsWith('.json')) await fs.rm(path.join(OUT_DIR, entry))
    }
  }

  async write(testcaseData: TestcaseDataInterface): Promise<void> {
    const file = path.join(OUT_DIR, `${testcaseData.tableName}.${testcaseData.name}.json`)
    await fs.writeFile(file, JSON.stringify(testcaseData, null, 2))
    this.written.push(testcaseData)
  }

  after(): Promise<void> {
    return Promise.resolve()
  }
}

async function main() {
  const logger = new LoggerMemory({ writeConsole: process.argv.includes('--verbose') })

  const fileProcessor = createDefaultFileProcessor(logger)
  await fileProcessor.load([XLSX_FILE])
  // TestcaseProcessor wants the tables keyed by name; with the array every ref: fails
  const tables: Record<string, TableInterface> = {}
  for (const table of fileProcessor.tables) tables[table.tableName] = table
  if (Object.keys(tables).length === 0) throw new Error(`no table loaded from ${XLSX_FILE}`)
  console.log(`loaded: ${Object.keys(tables).join(', ')}`)

  const registry = new DataGeneratorRegistry()
  registry.registerGenerator('faker', new GeneratorFaker({ generatorRegistry: registry, name: 'faker', logger }))
  registry.registerGenerator('text', new GeneratorText({ generatorRegistry: registry, name: 'text', logger }))

  const writer = new FixtureWriter(logger)
  const processor = new TestcaseProcessor({ logger, generatorRegistry: registry, writer: [writer], tables })
  await processor.process()

  const perTable: Record<string, number> = {}
  for (const tc of writer.written) perTable[tc.tableName] = (perTable[tc.tableName] ?? 0) + 1
  for (const [table, n] of Object.entries(perTable)) console.log(`  ${table}: ${n} test case(s)`)

  const warnings = logger.entries.warning
  const errors = logger.entries.error
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`)
    for (const w of warnings) console.log(JSON.stringify(w))
  }
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s) while generating:`)
    for (const e of errors) console.error(JSON.stringify(e, null, 2))
    process.exit(1)
  }
  console.log(`\n${writer.written.length} fixture(s) written to ${path.relative(process.cwd(), OUT_DIR) || '.'}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err)
  process.exit(1)
})
