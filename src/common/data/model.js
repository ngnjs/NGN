'use strict'

/**
 * @class NGN.DATA.Model
 * Represents a data model/record.
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
class NGNDataModel extends NGN.EventEmitter {
  constructor (config) {
    config = config || {}

    super()

    Object.defineProperties(this, {
      /**
       * @property {Symbol} oid
       * A unique object ID assigned to the model. This is an
       * internal readon-only reference.
       * @private
       */
      oid: NGN.privateconst(Symbol()),

      /**
       * @cfg {String} [idAttribute='id']
       * Setting this allows an attribute of the object to be used as the ID.
       * For example, if an email is the ID of a user, this would be set to
       * `email`.
       */
      idAttribute: NGN.privateconst(config.idAttribute || 'id'),

      /**
       * @cfg {object} fields
       * Represents the data fields of the model.
       */
      datafields: NGN.private(config.fields),

      /**
       * @property {Object}
       * Custom validation rules used to verify the integrity of the entire
       * model. This only applies to the full model. Individual data fields
       * may have their own validators.
       */
      validators: NGN.private(NGN.coalesce(config.validators, {})),

      /**
       * @cfgproperty {boolean} [validation=true]
       * Toggle data validation using this.
       */
      validation: NGN.public(NGN.coalesce(config.validation, true)),

      /**
       * @cfg {boolean} [autoid=false]
       * If the NGN.DATA.Model#idAttribute/id is not provided for a record,
       * unique ID will be automatically generated for it. This means there
       * will not be a `null` ID.
       *
       * An NGN.DATA.Store using a model with this set to `true` will never
       * have a duplicate record, since the #id or #idAttribute will always
       * be unique.
       */
      autoid: NGN.public(NGN.coalesce(config.autoid, false)),

      benchmark: NGN.private(null),

      /**
       * @cfgproperty {Date|Number} [expires]
       * When this is set to a date/time, the model record will be marked
       * as expired at the specified time/date. If a number is specified
       * (milliseconds), the record will be marked as expired after the
       * specified time period has elapsed. When a record/model is marked as
       * "expired", it triggers the `expired` event. By default, expired
       * records/models within an NGN.DATA.Store will be removed from the store.
       *
       * Setting this to any value less than `0` disables expiration.
       * @fires expired
       * Triggered when the model/record expires.
       */
      expiration: NGN.private(null),

      // Used to hold a setTimeout method for expiration events.
      expirationTimeout: NGN.private(null),
    })
  }
}
