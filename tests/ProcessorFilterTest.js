import { createOpts } from './Helper'
import { SimpleArrayFilterProcessor } from '@xhubiotable/processor'

test('_isFilterOk with valid data', async () => {
  // Create the testcase processor with all the data needed
  const opts = await createOpts()
  const processor = opts.processor
  const filterProcessor = new SimpleArrayFilterProcessor()
  processor.addFilterProcessor(filterProcessor)

  // Defines the tags
  processor._getTags = () => {
    return ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  }

  // define the filter names
  const tcdef = {
    createFilter: () => {
      return [
        {
          filterProcessorName: 'SimpleArrayFilter',
          expression: 'Prio 1; Prio 2',
        },
      ]
    },
  }

  const res = processor._isFilterOk({ callTree: '', testcaseDefinition: tcdef })

  expect(res).toBeTruthy()
})

test('_isFilterOk: empty tags always true', async () => {
  // Create the testcase processor with all the data needed
  const opts = await createOpts()
  const processor = opts.processor
  const filterProcessor = new SimpleArrayFilterProcessor()
  processor.addFilterProcessor(filterProcessor)

  // Defines the tags
  processor._getTags = () => {
    return []
  }

  // define the filter names
  const tcdef = {
    createFilter: () => {
      return [
        {
          filterProcessorName: 'SimpleArrayFilter',
          expression: 'Prio 1; Prio 2',
        },
      ]
    },
  }

  const res = processor._isFilterOk({ callTree: '', testcaseDefinition: tcdef })
  expect(res).toBeTruthy()
})

test('_isFilterOk: empty filter always true', async () => {
  // Create the testcase processor with all the data needed
  const opts = await createOpts()
  const processor = opts.processor
  const filterProcessor = new SimpleArrayFilterProcessor()
  processor.addFilterProcessor(filterProcessor)

  // Defines the tags
  processor._getTags = () => {
    return ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  }

  // define the filter names
  const tcdef = {
    createFilter: () => {
      return [
        {
          filterProcessorName: 'SimpleArrayFilter',
          expression: 'Prio 1; Prio 2',
        },
      ]
    },
  }

  const res = processor._isFilterOk({ callTree: '', testcaseDefinition: tcdef })
  expect(res).toBeTruthy()
})

test('_isFilterOk: Filter Not matching', async () => {
  // Create the testcase processor with all the data needed
  const opts = await createOpts()
  const processor = opts.processor
  const filterProcessor = new SimpleArrayFilterProcessor()
  processor.addFilterProcessor(filterProcessor)

  // Defines the tags
  processor._getTags = () => {
    return ['Prio 1', 'Prio 2', 'Prio 3', 'Prio 4']
  }

  // define the filter names
  const tcdef = {
    createFilter: () => {
      return [
        {
          filterProcessorName: 'SimpleArrayFilter',
          expression: 'Prio1; Prio2',
        },
      ]
    },
  }

  const res = processor._isFilterOk({ callTree: '', testcaseDefinition: tcdef })
  expect(res).toBeFalsy()
})
