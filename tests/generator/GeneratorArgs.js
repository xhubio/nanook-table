'use strict'

import { DataGeneratorBase } from '@xhubiotable/data-generator'

/**
 * This generator is only used for the process test.
 * It takes the value given as an argument and returns it
 */

export default class GeneratorArgs extends DataGeneratorBase {
  /**
   * @see  DataGeneratorInterface._doGenerate
   */
  // eslint-disable-next-line no-unused-vars
  async _doGenerate(instanceId, testcase, todoGenerator) {
    return todoGenerator.config
  }
}
