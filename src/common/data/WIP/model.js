'use strict'

/**
 * @class NGN.DATA.Model
 * Represents a data model/record.
 * @extends NGN.Class
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */

class NgnDataModel extends NGN.EventEmitter {
  constructor (confg) {
    config = config || {}

    super()


  }
}

NGN.DATA = NGN.DATA || {}

Object.defineProperties(NGN.DATA, {
  Model: NGN.const(function (cfg) {
    const ModelLoader = function (data) {
      let model = new NgnDataModel(cfg)

      if (data) {
        model.load(data)
      }

      return model
    }

    return ModelLoader
  }),

  Entity: NGN.private(NgnDataModel)
})

if (NGN.nodelike) {
  module.exports = NGN.DATA
}
