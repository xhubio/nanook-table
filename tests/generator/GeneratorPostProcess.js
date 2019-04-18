'use strict'

import { DataGeneratorBase } from '@xhubiotable/data-generator'

/**
 * This generator is only used for the process test.
 * It takes the value from the testcase and build an email out of it
 */

export default class GeneratorPostProcess extends DataGeneratorBase {
  /**
   * @see  DataGeneratorInterface._doGenerate
   */
  // eslint-disable-next-line no-unused-vars
  async _doGenerate(instanceId, testcase, todoGenerator) {
    return `<GeneratorPostProcess>`
  }

  // eslint-disable-next-line no-unused-vars
  async postProcess(instanceId, testcaseData, todo, parameter) {
    if (this.genCalls === undefined) {
      this.genCalls = []
    }
    this.genCalls.push(todo.name)
  }
}
