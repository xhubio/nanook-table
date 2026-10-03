import path from 'node:path'
import { expect, test } from 'vitest'

import { LoggerMemory } from '../../src/logger/index.js'
import {
  DataGeneratorBase,
  DataGeneratorRegistry
} from '../../src/data-generator/index.js'
import type { DataGeneratorGenerateRequest } from '../../src/data-generator/index.js'
import type { GeneratorDirectiveInterface } from '../../src/model/index.js'
import { createDefaultFileProcessor } from '../../src/processor/defaults.js'
import { TestcaseProcessor } from '../../src/processor/index.js'
import type { InterfaceWriter } from '../../src/processor/index.js'
import type { TestcaseDataInterface } from '../../src/processor/TestcaseDataInterface.js'
import type { TableInterface } from '../../src/model/index.js'

/**
 * MainTable.x references 'ref:1:SubTable::sub1'; SubTable.a is 'gen::args:Wert-A'.
 * So the generator directive belongs to the referenced node, not to the root.
 */

// records the instance IDs it is called with and asks for one post-processing step
class GeneratorProbe extends DataGeneratorBase {
  generateIds: string[] = []
  postProcessIds: string[] = []

  // eslint-disable-next-line require-await
  protected async doGenerate(request: DataGeneratorGenerateRequest) {
    this.generateIds.push(request.instanceId)
    return request.generatorDirective?.config
  }

  // eslint-disable-next-line require-await
  async createPostProcessDirectives(
    request: DataGeneratorGenerateRequest
  ): Promise<GeneratorDirectiveInterface[] | undefined> {
    return request.generatorDirective ? [request.generatorDirective] : undefined
  }

  // eslint-disable-next-line require-await
  async postProcess(
    request: DataGeneratorGenerateRequest
  ): Promise<GeneratorDirectiveInterface[] | undefined> {
    this.postProcessIds.push(request.instanceId)
    return
  }
}

async function run() {
  const logger = new LoggerMemory()
  const fileProcessor = createDefaultFileProcessor(logger)
  await fileProcessor.load([
    path.join(import.meta.dirname, 'fixtures', 'dt_subtable_selfref.xls')
  ])
  const tables: Record<string, TableInterface> = {}
  for (const table of fileProcessor.tables) tables[table.tableName] = table

  const generatorRegistry = new DataGeneratorRegistry()
  const probe = new GeneratorProbe({ generatorRegistry, name: 'args', logger })
  generatorRegistry.registerGenerator('args', probe)

  const written: TestcaseDataInterface[] = []
  const writer: InterfaceWriter = {
    logger,
    before: () => Promise.resolve(),
    write: (testcaseData: TestcaseDataInterface) => {
      written.push(testcaseData)
      return Promise.resolve()
    },
    after: () => Promise.resolve()
  }

  const processor = new TestcaseProcessor({
    logger,
    generatorRegistry,
    writer: [writer],
    tables
  })
  await processor.processTable(tables.MainTable)

  expect(logger.entries.error).toEqual([])
  expect(written).toHaveLength(1)
  return { probe, testcase: written[0] }
}

test('the call tree carries the instance ID of the test case', async () => {
  const { testcase } = await run()

  expect(testcase.callTree.instanceId).toBe(testcase.instanceId)
  // the referenced record is reachable through the call tree
  const [child] = testcase.callTree.children
  expect(testcase.data[child.tableName][child.instanceId]).toBeDefined()
})

test('postProcess gets the instance ID generate got, also in a referenced table', async () => {
  const { probe, testcase } = await run()

  expect(probe.generateIds).toHaveLength(1)
  expect(probe.postProcessIds).toEqual(probe.generateIds)
  // the directive belongs to SubTable, so it is not the root instance
  expect(probe.postProcessIds[0]).not.toBe(testcase.instanceId)
})
