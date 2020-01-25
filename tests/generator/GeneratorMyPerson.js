'use strict'

import { DataGeneratorBase } from '@xhubiotable/data-generator'

/**
 * This generator is only used for the process test.
 * It takes the value from the testcase and build an email out of it
 */

export default class GeneratorMyPerson extends DataGeneratorBase {
  /**
   * @see  DataGeneratorInterface._doGenerate
   */
  // eslint-disable-next-line no-unused-vars
  async _doGenerate(instanceId, testcase, todoGenerator) {
    const personData = testcase.data[instanceId].Person_no_ref
    if (
      personData !== undefined &&
      (personData['first-name'] !== undefined ||
        personData['last-name'] !== undefined)
    ) {
      return `${personData['first-name'].val}.${personData['last-name'].val}@foo.bar`
    }
    return undefined
  }
}
