import { createOpts } from './Helper'

test('postProcessGenerators', async () => {
  // Create the testcase processor with all the data needed
  const opts = await createOpts()
  const processor = opts.processor

  const testcaseData = {
    postProcessTodos: [
      {
        order: 3,
        instanceIdSuffix: 'instId',
        generatorName: 'postProcess',
        name: 'third',
      },
      {
        order: 2,
        instanceIdSuffix: 'instId',
        generatorName: 'postProcess',
        name: 'second',
      },
      {
        order: 1,
        instanceIdSuffix: 'instId',
        generatorName: 'postProcess',
        name: 'first',
      },
      {
        instanceIdSuffix: 'instId',
        generatorName: 'postProcess',
        name: 'last',
      },
      {
        order: 10,
        instanceIdSuffix: 'instId',
        generatorName: 'postProcess',
        name: 'forth',
      },
    ],
  }

  // call the post processing
  await processor.postProcessGenerators(testcaseData)

  // get the used generator
  const generator = opts.generators.getGenerator('postProcess')

  expect(generator.genCalls).toEqual([
    'first',
    'second',
    'third',
    'forth',
    'last',
  ])
})
