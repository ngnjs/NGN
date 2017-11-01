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
  constructor (config) {
    config = config || {}

    super()

    Object.defineProperties(this, {
      /**
       * @cfg {String} [idAttribute='id']
       * Setting this allows an attribute of the object to be used as the ID.
       * For example, if an email is the ID of a user, this would be set to
       * `email`.
       */
      idAttribute: NGN.privateconst(config.idAttribute || 'id'),

      /**
       * @cfg {object} fields
       * A private object containing the data fields of the model, including
       * validators & default values.
       * ```js
       * fields: {
       *   fieldname: {
       *     required: true,
       *     type: String,
       *     default: 'default field value'
       *   },
       *   fieldname2: null // Uses default field config (default value is null)
       * }
       * ```
       */
      /**
       * @datafield {string} [id=null]
       * The unique ID of the person.
       */
      fields: NGN.private(config.fields ||
        {
          id: {
            required: true,
            type: String,
            'default': config.id || null
          }
        }
      ),

      /**
       * @cfg {object} metaFields
       * Meta fields are configured exactly the same way as #fields,
       * except they're "hidden". They are explicity excluded from #data,
       * #representation, #relationships, and any other type of data.
       * However; these fields can be referenced by data proxies, #virtuals,
       * or extensions to the NGN.DATA.Model class.
       */
      hiddenFields: NGN.private(NGN.coalesce(config.metaFields)),

      /**
       * @cfg {object|NGN.DATA.Model|NGN.DATA.Store} relationships
       * An object containing fields that reference another data set. This can
       * contain a configuration, an NGN.DATA.Model, or an NGN.DATA.Store.
       * ```js
       * // Metadata
       * relationships: {
       *   fieldname: {
       *     required: true,
       *     ref: MyModel
       *   },
       *   fieldname2: {
       *     required: false,
       *     ref: MyDataStore,
       *     default: {}
       *   }
       * }
       * // or
       * relationships: {
       *   fieldname: MyModel
       * }
       * ```
       * Using the second syntax assumes the field **is required**.
       *
       * It is then possible to reference a join by the fieldname. For example:
       *
       * ```js
       * console.log(MyModel.fieldname.data) // Displays the MyModel data.
       * ```
       * @type {[type]}
       */
      joins: NGN.private(config.relationships || {}),

      /**
       * @cfg {Object} virtuals
       * A private object containing virtual data attributes and generated data.
       * Virtual datafields are derived values. They are not part of the
       * underlying data.
       *
       * **Example:**
       *
       * ```js
       * let Model = new NGN.DATA.Model({
       *   fields: {
       *     dateOfBirth: null
       *   },
       *   virtuals: {
       *     age: function () {
       *       return YearsApart(new Date(), this.dateOfBirth)
       *     }
       *   }
       * })
       * ```
       * The `age` example above compares the `dateOfBirth` field
       * to the current date, expecting a numeric response.
       * @private
       */
      virtuals: NGN.private(config.virtuals || {}),

      /**
       * @property {Object}
       * The validation rules used to verify data integrity when persisting to a datasource.
       * @private
       */
      validators: NGN.private({}),

      /**
       * @cfgproperty {boolean} [validation=true]
       * Toggle data validation using this.
       */
      validation: NGN.public(NGN.coalesce(config.validation, true)),

      /**
       * @property {Boolean}
       * Indicates the model is new or does not exist according to the persistence store.
       * @private
       * @readonly
       */
      isNew: NGN.private(true),

      /**
       * @property {Boolean}
       * Indicates the model has been destroyed/deleted and should no longer exist.
       * @private
       * @readonly
       */
      isRecordDestroyed: NGN.private(false),

      /**
       * @property {String} [oid=null]
       * The raw object ID, which is either the #id or #idAttribute depending
       * on how the object is configured.
       * @private
       */
      oid: NGN.private(config[this.idAttribute] || null),

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

      // Placeholder expiration flag.
      hasExpired: NGN.private(false),

      // Used to prevent expiration of a record.
      ignoreTTL: NGN.private(false),

      /**
       * @property {Number} created
       * The date/time when the model is created. This is represented as
       * the number of milliseconds since the epoch (Jan 1, 1970, 00:00:00 UTC).
       * @private
       */
      createDate: NGN.privateconst(Date.now()),

      /**
       * @method setUnmodified
       * This method forces the model to be viewed as unmodified, as though
       * the record was just loaded from it's source. This method should only
       * be used when custom loading data. The #load method automatically
       * invokes this when record data is loaded. This also clears the history,
       * just as if the record is brand new.
       * @private
       */
      setUnmodified: NGN.privateconst(function () {
        this.benchmark = this.checksum
        this.changelog = []
      }),

      /**
       * @cfg {Boolean} [allowInvalidSave=false]
       * Set this to true to allow a save even though not all of the data properties
       * pass validation tests.
       */
      allowInvalidSave: NGN.private(NGN.coalesce(config.allowInvalidSave, false)),

      /**
       * @cfg {Boolean} [disableDataValidation=false]
       * Only used when #save is called. Setting this to `true` will bypass data validation.
       */
      disableDataValidation: NGN.private(NGN.coalesce(config.disableDataValidation, false)),

      invalidDataAttributes: NGN.private([]),

      initialDataAttributes: NGN.private([]),

      /**
       * @property {array} changelog
       * An ordered array of changes made to the object data properties.
       * This cannot be changed manually. Instead, use #history
       * and #undo to manage this list.
       * @private
       */
      changelog: NGN.private([]),

      _nativeValidators: NGN.privateconst({
        min: function (minimum, value) {
          if (NGN.typeof(value) === 'array') {
            return value.length >= minimum
          }

          if (NGN.typeof(value) === 'number') {
            return value >= minimum
          }

          if (NGN.typeof(value) === 'string') {
            return value.trim().length >= minimum
          }

          if (NGN.typeof(value) === 'date') {
            return value.parse() >= minimum.parse()
          }

          return false
        },

        max: function (maximum, value) {
          if (NGN.typeof(value) === 'array') {
            return value.length <= maximum
          }

          if (NGN.typeof(value) === 'number') {
            return value <= maximum
          }

          if (NGN.typeof(value) === 'string') {
            return value.trim().length <= maximum
          }

          if (NGN.typeof(value) === 'date') {
            return value.parse() <= maximum.parse()
          }

          return false
        },

        enum: function (valid, value) {
          return valid.indexOf(value) >= 0
        },

        required: (field, value) => {
          return this.hasOwnProperty(field) && this[value] !== null
        }
      }),

      /**
       * @cfgproperty {Object} dataMap
       * An object mapping model attribute names to data storage field names.
       *
       * _Example_
       * ```
       * {
       *   father: 'dad',
       *	 email: 'eml',
       *	 image: 'img',
       *	 displayName: 'dn',
       *	 firstName: 'gn',
       *	 lastName: 'sn',
       *	 middleName: 'mn',
       *	 gender: 'sex',
       *	 dob: 'bd',
       * }
       * ```
       */
      _dataMap: NGN.private(config.dataMap || null),
      _reverseDataMap: NGN.public(null),

      /**
       * @property {object} raw
       * The raw data.
       * @private
       */
      raw: NGN.private({}),

      /**
       * @property {object} rawjoins
       * The related data models/stores.
       * @private
       */
      rawjoins: NGN.private({}),

      _store: NGN.private(null),

      /**
       * @cfg {NGN.DATA.Proxy} proxy
       * The proxy used to transmit data over a network. This is more commonly
       * used with the NGN.DATA.Store instead of the Model, but this exists for
       * situations where a single model instance represents the entire data set,
       * such as simple user preferences or settings. **This overrides store proxies!**
       *
       * If this Model is added to a NGN.DATA.Store and the store has it's own proxy,
       * this proxy will override it. For example:
       *
       * ```js
       * let myRecord = new NGN.DATA.Model({
       *   fields: {...},
       *   proxy: new NGNX.DATA.SomeDatabaseProxy() // <-- NOTICE
       * })
       *
       * let myStore = new NGN.DATA.Store({
       *   model: myRecord,
       *   proxy: new NGNX.DATA.SomeOtherProxy() // <-- NOTICE
       * })
       *
       * myStore.add(new myRecord({
       *   field: value,
       *   field2: value
       * }))
       *
       * myStore.save() // This executes NGNX.DATA.SomeDatabaseProxy.save()
       * ```
       *
       * This is the **least** efficient way to deal with bulk records. If you are
       * dealing with multiple records, a proxy should be applied to the NGN.DATA.Store,
       * not the NGN.DATA.Model.
       *
       * A better case for this proxy are independent models representing
       * key/value stores. For example:
       *
       * ```js
       * let userPreferences = new NGN.DATA.Model({
       *   fields: {
       *     alwaysDoThis: Boolean,
       *     neverDoThat: Boolean
       *   },
       *   proxy: new NGNX.DATA.SomeDatabaseProxy()
       * })
       *
       * userPreferences.save()
       * ```
       *
       * Notice this example contains no store, just a model. In this scenario, the model
       * represents the entire data set, so no store is necessary.
       */
      _proxy: NGN.private(config.proxy || null),

      /**
       * @cfgproperty {boolean} [proxyignore=false]
       * A placeholder to determine whether data proxies should
       * ignore the record or not. By default, proxies will operate
       * on the record (set this to true to prevent proxy action on the model).
       */
      proxyignore: NGN.private(NGN.coalesce(config.proxyignore, false))
    })

    // Make sure the ID field exists.
    if (NGN.coalesce(this.idAttribute, '') !== 'id' && !this.fields.hasOwnProperty(this.idAttribute)) {
      console.warn(this.idAttribute + ' is specified as the ID, but it is not defined in the fields.')
    }

    // Add proxy support for independent models
    if (config.proxy) {
      if (this._proxy instanceof NGN.DATA.Proxy) {
        this._proxy.init(this)
      } else {
        throw new Error('Invalid proxy configuration.')
      }
    }

    // Make sure there aren't duplicate field names defined (includes joins)
    let allfields = this.datafields.concat(this.virtualdatafields).concat(this.relationships).filter(function (key, i, a) {
      return a.indexOf(key) !== i
    })

    if (allfields.length > 0) {
      throw new Error('Duplicate field names exist: ' + allfields.join(', ') + '. Unique fieldnames are required for data fields, virtuals, and relationship fields.')
    }

    // Make sure an ID reference is available.
    if (!this.fields.hasOwnProperty('id')) {
      config.fields.id = {
        required: true,
        type: String,
        'default': config.id || null
      }
    }

    // Add fields
    Object.keys(this.fields).forEach((field) => {
      if (typeof this.fields[field] !== 'object' && this.fields[field] !== null) {
        this.fields[field] = {
          required: true,
          type: this.fields[field],
          default: null,
          name: field
        }
      }

      this.addField(field, true)
    })

    // Add meta/hidden fields
    if (this.hiddenFields) {
      Object.keys(this.hiddenFields).forEach((field) => {
        this.addMetaField(field, NGN.coalesce(this.hiddenFields[field], null), true)
      })
    }

    // Add virtuals
    Object.keys(this.virtuals).forEach((v) => {
      Object.defineProperty(this, v, NGN.get(() => {
        return this.virtuals[v].apply(this)
      }))
    })

    // Add relationships
    Object.keys(this.joins).forEach((field) => {
      this.addRelationshipField(field, this.joins[field], true)
    })

    let events = [
      'field.update',
      'field.create',
      'field.remove',
      'field.invalid',
      'validator.add',
      'validator.remove',
      'relationship.create',
      'relationship.remove',
      'expired',
      'deleted',
      'reset',
      'load'
    ]

    if (NGN.BUS) {
      events.forEach((eventName) => {
        this.on(eventName, function () {
          let args = NGN.slice(arguments)
          args.push(this)
          args.unshift(eventName)
          NGN.BUS.emit.apply(NGN.BUS, args)
        })
      })
    }

    // If an expiration is defined, set it.
    if (config.hasOwnProperty('expires')) {
      this.expires = config.expires
    }

    // Handle changelog modifications & notify listeners (stores)
    this.on('changelog.append', (delta) => {
      delta.id = NGN.DATA.util.GUID()
      this.changelog.push(delta)
      this.emit('append.changelog', delta)
    })

    this.on('changelog.remove', (idList) => {
      idList = Array.isArray(idList) ? idList : [idList]
      this.emit('remove.changelog', idList)
    })
  }

  get proxy () {
    return this._proxy
  }

  set proxy (value) {
    if (!this._proxy && value instanceof NGN.DATA.Proxy) {
      this._proxy = value
      this._proxy.init(this)
    }
  }

  get deleted () {
    return this.isRecordDestroyed
  }

  set isDestroyed (value) {
    if (typeof value !== 'boolean') {
      console.warn(NGN.stack)
      throw new Error('Invalid data type. isDestroyed must be a boolean. Received ' + (typeof value))
    }

    this.isRecordDestroyed = value

    if (value) {
      this.emit('deleted')
    }
  }

  get expires () {
    return this.expiration
  }

  set expires (value) {
    // Validate data type
    if (NGN.typeof(value) !== 'date' && NGN.typeof(value) !== 'number') {
      try {
        const source = NGN.stack.pop()
        console.warn('Expiration could not be set at %c' + source.path + '%c (Invalid data type. Must be a Date or number).', NGN.css, '')
      } catch (e) {
        console.warn('Expiration could not be set (Invalid data type. Must be a Date or number).')
      }

      return
    }

    // Clear existing expiration timer if it is already set.
    clearTimeout(this.expirationTimeout)

    // If the new value is a number, convert to a date.
    if (NGN.typeof(value) === 'number') {
      if (value < 0) {
        this.ignoreTTL = true
        return
      }

      const currentDate = new Date()

      value = new Date (
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        currentDate.getHours(),
        currentDate.getMinutes(),
        currentDate.getSeconds(),
        currentDate.getMilliseconds() + value
      )
    }

    // If the process has reached this far, expiration
    // actions should be enabled.
    this.ignoreTTL = false

    // Set the new expiration time period
    this.expiration = value

    // If the record is already expired, immediately trigger the expiration.
    if (Date.now() >= this.expiration.getTime()) {
      this.expire()
      return
    }

    this.hasExpired = false

    // If the expiration is in the future, set a timer to expire.
    let waitPeriod = this.expiration.getTime() - Date.now()
    this.expirationTimeout = setTimeout(() => {
      this.expire()
    }, waitPeriod)
  }

  /**
   * @property {boolean} expired
   * Indicates the record/model is expired.
   */
  get expired () {
    if (this.ignoreTTL) {
      return false
    }

    return this.hasExpired
  }

  /**
   * @property {Boolean}
   * Indicates one or more data properties has changed.
   * @readonly
   */
  get modified () {
    return this.checksum !== this.benchmark
  }

  /**
   * @cfgproperty {String/Number/Date} [id=null]
   * The unique ID of the model object. If #idAttribute is defined,
   * this will get/set the #idAttribute value.
   */
  get id () {
    return this.oid
  }

  set id (value) {
    this.oid = value
  }

  /**
   * @property checksum
   * The unique checksum of the record (i.e. a record fingerprint).
   * This will change as the data changes.
   */
  get checksum () {
    return NGN.DATA.util.checksum(JSON.stringify(this.data))
  }

  /**
   * @property {Object} dataMap
   * The current data map.
   * @private
   */
  get dataMap () {
    return this._dataMap
  }

  set dataMap (value) {
    this._dataMap = value
    this._reverseDataMap = null
  }

  /**
   * @property {NGN.DATA.Store} store
   * If a store is associated with the model, this will
   * provide a reference to it. If there is no store, this
   * will return `null`.
   */
  get datastore () {
    return this._store
  }

  /**
   * @property {boolean} valid
   * Indicates the record is valid.
   */
  get valid () {
    this.validate()
    return this.invalidDataAttributes.length === 0
  }

  /**
   * @property datafields
   * Provides an array of data fields associated with the model.
   * @returns {String[]}
   */
  get datafields () {
    if (!this.hiddenFields) {
      return Object.keys(this.fields)
    }

    let hidden = NGN.coalesce(this.hiddenFields, {})

    return Object.keys(this.fields).filter((fieldname) => {
      return !hidden.hasOwnProperty(fieldname)
    })
  }

  /**
   * @property reslationships
   * Provides an array of join fields associated with the model.
   * @returns {String[]}
   */
  get relationships () {
    return Object.keys(this.joins)
  }

  /**
   * @property virtualdatafields
   * Provides an array of virtual data fields associated with the model.
   * @returns {String[]}
   */
  get virtualdatafields () {
    return Object.keys(this.virtuals)
  }

  /**
   * @property {object} reverseMap
   * Reverses the data map. For example, if the original #dataMap
   * looks like:
   *
   * ```js
   * {
   *    firstname: 'gn',
   *    lastname: 'sn
   * }
   * ```
   *
   * The reverse map will look like:
   *
   * ```js
   * {
   *    gn: 'firstname',
   *    sn: 'lastname
   * }
   * ```
   */
  get reverseMap () {
    if (this.dataMap !== null) {
      if (this._reverseDataMap !== null) {
        return this._reverseDataMap
      }
      let rmap = {}
      const me = this
      Object.keys(this._dataMap).forEach(function (attr) {
        rmap[me._dataMap[attr]] = attr
      })
      this._reverseDataMap = rmap
      return rmap
    }
    return null
  }

  /**
    * @property data
    * Creates a JSON object from the data entity. This is
    * a record that can be persisted to a database or other data store.
    * @readonly.
    */
  get data () {
    let d = this.serialize()

    if (!d.hasOwnProperty(this.idAttribute) && this.autoid) {
      d[this.idAttribute] = this[this.idAttribute]
    }

    if (this.dataMap) {
      const me = this
      // Loop through the map keys
      Object.keys(this.dataMap).forEach(function (key) {
        // If the node contains key, make the mapping
        if (d.hasOwnProperty(key)) {
          if (d[key] instanceof NGN.DATA.Model) {
            d[me.dataMap[key]] = d[key].data
          } else {
            d[me.dataMap[key]] = d[key]
          }
          delete d[key]
        }
      })
    }

    return d
  }

  /**
   * @property representation
   * Creates a JSON representation of the record.
   * Think of this as #data + #virtuals.
   */
  get representation () {
    let data = this.data

    // Add relationships
    Object.keys(this.rawjoins).forEach((join) => {
      data[join] = this.rawjoins[join].representation
    })

    // Add virtual fields
    Object.keys(this.virtuals).forEach((attribute) => {
      let val = this[attribute]
      if (val instanceof NGN.DATA.Entity || val instanceof NGN.DATA.Store) {
        data[attribute] = this[attribute].representation
      } else if (typeof val !== 'function') {
        data[attribute] = this[attribute]
      }
    })

    return data
  }

  /**
   * @property history
   * The history of the entity (i.e. changelog).The history
   * is shown from most recent to oldest change. Keep in mind that
   * some actions, such as adding new custom fields on the fly, may
   * be triggered before other updates.
   * @returns {array}
   */
  get history () {
    return this.changelog.reverse()
  }

  /**
   * @method expire
   * Forcibly expire the model/record.
   * @param {Date|Number} [duration]
   * Optionally provide a new expiration time. This is an alternative
   * way of setting #expires. If no value is specified, the record
   * will immediately be marked as `expired`.
   */
  expire (duration) {
    if (this.expired) {
      return
    }

    if (duration) {
      this.expires = duration
      return
    }

    if (this.ignoreTTL) {
      return
    }

    // Force expiration.
    this.hasExpired = true

    clearTimeout(this.expirationTimeout)

    this.emit('expired', this)
  }

  /**
   * @method disableExpiration
   * Do not expire this model/record.
   */
  disableExpiration () {
    this.expires = -1
  }

  /**
    * @method addValidator
    * Add or update a validation rule for a specific model property.
    * @param {String} field
    * The data field to test.
    * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
    * The validation used to test the property value. This should return
    * `true` when the data is valid and `false` when it is not.
    *
    * * When this is a _function_, the value is passed to it as an argument.
    * * When this is a _String_, the value is compared for an exact match (case sensitive)
    * * When this is a _Number_, the value is compared for equality.
    * * When this is a _Date_, the value is compared for exact equality.
    * * When this is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
    * * When this is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
    * * When this is _an array of dates_, the value is compared to each date for equality.
    * @fires validator.add
    */
  addValidator (property, validator) {
    if (!this.hasOwnProperty(property)) {
      console.warn('No validator could be create for %c' + property + '%c. It is not an attribute of %c' + this.type + '%c.', NGN.css, '', NGN.css, '')
      return
    }

    switch (typeof validator) {
      case 'function':
        this.validators[property] = this.validators[property] || []
        this.validators[property].push(validator)
        this.emit('validator.add', property)
        break
      case 'object':
        if (Array.isArray(validator)) {
          this.validators[property] = this.validators[property] || []
          this.validators[property].push(function (value) {
            return validator.indexOf(value) >= 0
          })
          this.emit('validator.add', property)
        } else if (validator.test) { // RegExp
          this.validators[property] = this.validators[property] || []
          this.validators[property].push(function (value) {
            return validator.test(value)
          })
          this.emit('validator.add', property)
        } else {
          console.warn('No validator could be created for %c' + property + '%c. The validator appears to be invalid.', NGN.css, '')
        }
        break
      case 'string':
      case 'number':
      case 'date':
        this.validators[property] = this.validators[property] || []
        this.validators[property].push(function (value) {
          return value === validator
        })
        this.emit('validator.add', property)
        break
      default:
        console.warn('No validator could be create for %c' + property + '%c. The validator appears to be invalid.', NGN.css, '')
    }
  }

  /**
    * @method removeValidator
    * Remove a data validator from the object.
    * @param {String} attribute
    * The name of the attribute to remove from the validators.
    * @fires validator.remove
    */
  removeValidator (attribute) {
    if (this.validators.hasOwnProperty(attribute)) {
      delete this.validators[attribute]
      this.emit('validator.remove', attribute)
    }
  }

  /**
    * @method validate
    * Validate one or all attributes of the data.
    * @param {String} [attribute=null]
    * Validate a specific attribute. By default, all attributes are tested.
    * @private
    * @returns {Boolean}
    * Returns true or false based on the validity of data.
    */
  validate (attribute) {
    // If validation is turned off, treat everything as valid.
    if (!this.validation) {
      return true
    }
    const me = this

    // Single Attribute Validation
    if (attribute) {
      if (this.validators.hasOwnProperty(attribute)) {
        for (let i = 0; i < this.validators[attribute].length; i++) {
          if (!me.validators[attribute][i].apply(me, [me[attribute]])) {
            me.invalidDataAttributes.indexOf(attribute) < 0 && me.invalidDataAttributes.push(attribute)
            return false
          } else {
            me.invalidDataAttributes = me.invalidDataAttributes.filter(function (attr) {
              return attribute !== attr
            })
          }
        }

        if (!this.validateDataType(attribute)) {
          this.invalidDataAttributes.push(attribute)
          return false
        }
      }

      return true
    }

    // Validate data type of each attribute
    this.datafields.forEach(function (field) {
      me.validate(field)
    })
  }

  /**
   * @method validateDataType
   * Indicates the data types match.
   * @param {string} fieldname
   * Name of the field whose data should be validated.
   * @private
   * @return {boolean}
   */
  validateDataType (field) {
    const fieldType = NGN.typeof(this[field])
    const expectedType = NGN.typeof(this.fields[field].type)

    if (fieldType !== 'null') {
      return fieldType === expectedType
    }

    if (this[field] === null && this.fields[field].required) {
      if (this.autoid && field === this.idAttribute) {
        return true
      }

      return false
    }

    return true
  }

  /**
   * @method getRelationshipField
   * Provides specific detail/configuration about a join/relationship.
   * @param {String} fieldname
   * The name of the field.
   * @returns {Object}
   */
  getRelationshipField (fieldname) {
    return this.joins[fieldname]
  }

  /**
   * @method hasRelationship
   * Indicates a data join exists.
   * @param {String} fieldname
   * The name of the data field.
   * @returns {Boolean}
   */
  hasRelationship (fieldname) {
    return this.joins.hasOwnProperty(fieldname)
  }

  /**
     * @method getDataField
     * Provides specific detail/configuration about a field.
     * @param {String} fieldname
     * The name of the data field.
     * @returns {Object}
     */
  getDataField (fieldname) {
    return this.fields[fieldname]
  }

  /**
   * @method getMappedFieldName
   * Retrieve the raw fieldname of the data field.
   * This is useful, particularly for NGN.DATA.Proxy
   * extensions, when a #dataMap is used to modify the
   * #data output.
   *
   * For example, consider the following #dataMap:
   *
   * ```js
   * dataMap: {
   *   "firstname": "gn",
   *   "lastname": "sn"
   * }
   * ```
   *
   * This data map would produce #data using the mapped names:
   *
   * ```js
   * {
   *   gn: 'John',
   *   sn: 'Doe'
   * }
   * ```
   *
   * Running `MyModel.getMappedFieldName('firstname')` would
   * return `gn`. This is designed to help data proxies and
   * other methods that need to interact directly with the
   * modified output generated by the #data attribute.
   */
  getMappedFieldName (fieldname) {
    if (!this.dataMap || !this.dataMap.hasOwnProperty(fieldname)) {
      return fieldname
    }

    return this.dataMap[fieldname]
  }

  /**
   * @method getReverseMappedFieldName
   * The same as #getMappedFieldName, but using the #reverseMap.
   *
   */
  getReverseMappedFieldName (fieldname) {
    if (!this.reverseMap || !this.reverseMap.hasOwnProperty(fieldname)) {
      return fieldname
    }

    return this.reverseMap[fieldname]
  }

  /**
   * @method hasDataField
   * Indicates a data field exists.
   * @param {String} fieldname
   * The name of the data field.
   * @returns {Boolean}
   */
  hasDataField (fieldname) {
    return this.fields.hasOwnProperty(fieldname)
  }

  /**
   * @method hasMetaField
   * Indicates a metadata (hidden) field exists.
   * @param {String} fieldname
   * The name of the data field.
   * @returns {Boolean}
   */
  hasMetaField (fieldname) {
    if (!this.has(fieldname)) {
      return false
    }

    return this.getDataField(fieldname).hidden
  }

  /**
   * @method has
   * Indicates an attribute exists. This is a generic method
   * that checks the data fields, relationships, virtuals (optional),
   * and ID attribute.
   * @param {string} attribute
   * The name of the attribute.
   * @param {boolean} [includeVirtuals=true]
   * Specify `true` to check the virtuals as well.
   * @returns {boolean}
   */
  has (attribute, includeVirtuals = true) {
    if (this.idAttribute === attribute || this.hasDataField(attribute) || this.hasRelationship(attribute)) {
      return true
    }

    if (includeVirtuals && this.hasVirtualField(attribute)) {
      return true
    }

    return false
  }

  /**
    * @method serialize
    * Creates a JSON data object with no functions. Only uses enumerable attributes of the object by default.
    * Specific data values can be included/excluded using #enumerableProperties & #nonEnumerableProperties.
    *
    * Any object property that begins with a special character will be ignored by default. Functions & Setters are always
    * ignored. Getters are evaluated recursively until a simple object type is found or there are no further nested attributes.
    *
    * If a value is an instance of NGN.model.Model (i.e. a nested model or array of models), reference string is returned in the data.
    * The model itself can be returned using #getXRef.
    * @param {Object} [obj]
    * Defaults to this object.
    * @param {Boolean} [ignoreID=false]
    * Do not include the ID attribute in the serialized output.
    * @protected
    */
  serialize (obj, ignoreID = false) {
    let _obj = obj || this.raw
    let rtn = {}

    for (let key in _obj) {
      _obj.nonEnumerableProperties = _obj.nonEnumerableProperties || ''
      if (this.fields.hasOwnProperty(key) && !this.hasMetaField(key)) {
        key = key === 'id' ? this.idAttribute : key

        if ((_obj.hasOwnProperty(key) && (_obj.nonEnumerableProperties.indexOf(key) < 0 && /^[a-z0-9 ]$/.test(key.substr(0, 1)))) || (_obj[key] !== undefined && _obj.enumerableProperties.indexOf(key) >= 0)) {
          let dsc = Object.getOwnPropertyDescriptor(_obj, key)
          if (!dsc.set) {
            // Handle everything else
            switch (typeof dsc.value) {
              case 'function':
                // Support date & regex proxies
                if (dsc.value.name === 'Date') {
                  rtn[key] = _obj[key].refs.toJSON()
                } else if (dsc.value.name === 'RegExp') {
                  rtn[key] = dsc.value()
                }
                break
              case 'object':
                // Support array proxies
                if (_obj[key] instanceof Array && !Array.isArray(_obj[key])) {
                  _obj[key] = _obj[key].slice(0)
                }

                rtn[key] = _obj[key]
                break
              default:
                rtn[key] = NGN.coalesce(_obj[key], this.fields[key].default, null)
                break
            }
          }
        }
      }
    }

    const me = this
    this.relationships.forEach(function (r) {
      rtn[r] = me.rawjoins[r].data
    })

    // Remove invalid ID
    if ((rtn.hasOwnProperty(this.idAttribute) && ignoreID) || (rtn.hasOwnProperty(this.idAttribute) && rtn[this.idAttribute] === undefined)) {
      delete rtn[this.idAttribute]
    }

    return rtn
  }

  /**
   * @method addField
   * Add a data field after the initial model definition.
   * @param {string} fieldname
   * The name of the field.
   * @param {object} [fieldConfiguration=null]
   * The field configuration (see cfg#fields for syntax).
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is added.
   */
  addField (field, fieldcfg = null, suppressEvents = false) {
    if (typeof fieldcfg === 'boolean') {
      suppressEvents = fieldcfg
      fieldcfg = null
    }

    const me = this
    let cfg = null

    if (field.toLowerCase() !== 'id') {
      if (typeof field === 'object') {
        if (!field.name) {
          throw new Error('Cannot create data field. The supplied configuration does not contain a unique data field name.')
        }

        cfg = field
        field = cfg.name
        delete cfg.name
      }

      if (me[field] !== undefined) {
        try {
          const source = NGN.stack.pop()
          console.warn('%c' + field + '%c data field defined multiple times (at %c' + source.path + '%c). Only the last defintion will be used.', NGN.css, '', NGN.css, '')
        } catch (e) {
          console.warn('%c' + field + '%c data field defined multiple times. Only the last definition will be used.', NGN.css, '', NGN.css, '')
        }

        delete me[field]
      }

      // Create the data field as an object attribute & getter/setter
      me.fields[field] = NGN.coalesce(cfg, fieldcfg, me.fields[field], {})
      me.fields[field].required = NGN.coalesce(me.fields[field].required, false)

      if (!me.fields[field].hasOwnProperty('type')) {
        if (me.fields[field].hasOwnProperty('default')) {
          let type = NGN.typeof(me.fields[field].default)
          type = type.charAt(0).toUpperCase() + type.slice(1)
          me.fields[field].type = eval(type)
        }
      }
      me.fields[field].type = NGN.coalesce(me.fields[field].type, String)
      if (field === me.idAttribute && me.autoid === true) {
        me.fields[field].type = String
        me.fields[field]['default'] = NGN.DATA.util.GUID()
      } else {
        me.fields[field]['default'] = NGN.coalesce(me.fields[field]['default'])
      }
      me.fields[field].hidden = NGN.coalesce(me.fields[field].hidden, false)
      me.raw[field] = me.fields[field]['default']
      me[field] = me.raw[field]

      Object.defineProperty(me, field, {
        get: function () {
          return NGN.coalesce(me.raw[field], me.fields[field].default, null)
        },
        set: function (value) {
          let old = me.raw[field]
          const wasInvalid = !me.validate(field)

          // if (old === value) {
          //   console.log('HIT')
          //   return
          // } else if (me.fields[field].type === Object && typeof value === 'object') {
          //   if (JSON.stringify(old) === JSON.stringify(value)) {
          //     return
          //   }
          // }

          me.raw[field] = value

          let c = {
            action: 'update',
            field: field,
            old: old,
            new: me.raw[field]
          }

          this.emit('changelog.append', c)
          this.emit('field.update', c)
          this.emit('field.update.' + field, c)

          // If the field is invalid, fire event.
          if (!me.validate(field)) {
            me.emit('field.invalid', {
              field: field
            })
          } else if (wasInvalid) {
            // If the field BECAME valid (compared to prior value),
            // emit an event.
            me.emit('field.valid', {
              field: field
            })
          }
        }
      })

      if (!suppressEvents) {
        let c = {
          action: 'create',
          field: field
        }
        this.emit('changelog.append', c)
        this.emit('field.create', c)
      }

      // Add field validators
      if (me.fields.hasOwnProperty(field)) {
        if (me.fields[field].hasOwnProperty('pattern')) {
          me.addValidator(field, me.fields[field].pattern)
        }
        ['min', 'max', 'enum'].forEach(function (v) {
          if (me.fields[field].hasOwnProperty(v)) {
            me.addValidator(field, function (val) {
              return me._nativeValidators[v](me.fields[field][v], val)
            })
          }
        })
        if (me.fields[field].hasOwnProperty('required')) {
          if (me.fields[field].required) {
            me.addValidator(field, function (val) {
              return me._nativeValidators.required(field, val)
            })
          }
        }
        if (me.fields[field].hasOwnProperty('validate')) {
          if (typeof me.fields[field].validate === 'function') {
            me.addValidator(field, function (val) {
              return me.fields[field].validate.apply(me, [val])
            })
          } else {
            const source = NGN.stack.pop()
            console.warn('Invalid custom validation function (in %c' + source.path + '%c). The value passed to the validate attribute must be a function.', NGN.css, '')
          }
        }
      }
    } else if (me.id === null && me.autoid) {
      me.id = NGN.DATA.util.GUID()
    }
  }

  /**
   * @method addMetaField
   * Add a metadata/hidden field.
   * @param {string} fieldname
   * The name of the field.
   * @param {object} [fieldConfiguration=null]
   * The field configuration (see cfg#fields for syntax).
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is added.
   */
  addMetaField (fieldname, fieldcfg = null) {
    if (!this.has(fieldname)) {
      this.hiddenFields = NGN.coalesce(this.hiddenFields, {})
      this.hiddenFields[fieldname] = fieldcfg
      this.addField.apply(this, arguments)
      this.fields[fieldname].hidden = true
    }
  }

  /**
   * @method addVirtual
   * Add a virtual field dynamically.
   * @param {string} name
   * The name of the attribute to add.
   * @param {function} handler
   * The synchronous method (or generator) that produces
   * the desired output.
   */
  addVirtual (name, fn) {
    const me = this
    Object.defineProperty(this, name, {
      get: function () {
        return fn.apply(me)
      }
    })
  }

  /**
   * @method addRelationshipField
   * Join another model dynamically.
   * @param {string} name
   * The name of the field to add.
   * @param {Object|NGN.DATA.Model} config
   * The configuration or data model type. This follows the same syntax
   * defined in the #joins attribute.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is added.
   */
  addRelationshipField (name, cfg, suppressEvents) {
    suppressEvents = suppressEvents !== undefined ? suppressEvents : false

    if (this.rawjoins.hasOwnProperty(name) || this.fields.hasOwnProperty(name) || this.hasOwnProperty(name)) {
      throw new Error(name + ' already exists. It cannot be added to the model again.')
    }

    if (typeof cfg === 'function' || typeof cfg === 'object' && !cfg.hasOwnProperty('type')) {
      cfg = {
        type: cfg
      }
    }

    if (!cfg.type) {
      throw new Error('Configuration has no reference! The reference must be an NGN.DATA.Model or NGN.DATA.Store.')
    }

    cfg.required = NGN.coalesce(cfg.required, true)
    cfg.default = cfg.default || null

    if (!this.joins.hasOwnProperty(name)) {
      this.joins[name] = cfg
    }

    const me = this
    let entityType = 'model'

    if (cfg.type instanceof NGN.DATA.Store) {
      entityType = 'store'
    } else if (NGN.typeof(cfg.type) === 'array') {
      if (cfg.type.length === 0) {
        throw new Error(name + ' cannot be an empty store. A model must be provided.')
      }

      entityType = 'collection'
    } else if (typeof cfg.type === 'object') {
      if (cfg.type.model) {
        entityType = 'store'
      }
    }

    if (entityType === 'store') {
      let storeCfg = {}
      if (cfg.type instanceof NGN.DATA.Store) {
        this.rawjoins[name] = cfg.type
        storeCfg = null
      } else if (cfg.type.model) {
        storeCfg = cfg.type
      } else {
        throw new Error('Nested store configuration is invalid or was not recognized.')
      }

      if (storeCfg !== null) {
        this.rawjoins[name] = new NGN.DATA.Store(storeCfg)
      }
      this.applyStoreMonitor(name)
    } else if (entityType === 'collection') {
      this.rawjoins[name] = new NGN.DATA.Store({
        model: cfg.type[0]
      })
      this.applyStoreMonitor(name)
    } else if (!cfg.type.data) {
      this.rawjoins[name] = cfg.default !== null ? new cfg.type(cfg.default) : new cfg.type()  // eslint-disable-line new-cap
      this.applyModelMonitor(name)
    } else if (cfg.type.data) {
      this.rawjoins[name] = cfg.type
      this.applyStoreMonitor(name)
    } else {
      throw new Error('Nested store configuration is invalid or was not recognized.')
    }

    Object.defineProperty(this, name, {
      enumerable: true,
      get: function () {
        return me.rawjoins[name]
      }
    })

    if (!suppressEvents) {
      let c = {
        action: 'create',
        field: name
      }

      this.emit('changelog.append', c)
      this.emit('relationship.create', c)
    }
  }

  /**
   * @method applyModelMonitor
   * Applies event handlers for bubbling model events.
   * @param {string} field
   * The relationship field name.
   * @private
   */
  applyModelMonitor (name) {
    const model = this.rawjoins[name]
    const me = this

    model.on('field.update', function (delta) {
      let payload = {
        action: 'update',
        field: name + '.' + delta.field,
        old: delta.old,
        new: delta.new,
        join: true,
        originalEvent: {
          event: 'field.update',
          record: model
        }
      }

      me.emit('field.update', payload)
      me.emit('field.update.' + name + '.' + delta.field, payload)
    })

    model.on('field.create', function (delta) {
      let payload = {
        action: 'update',
        field: name + '.' + delta.field,
        old: null,
        new: null,
        join: true,
        originalEvent: {
          event: 'field.create',
          record: model
        }
      }

      me.emit('field.update', payload)
      me.emit('field.update.' + name + '.' + delta.field, payload)
    })

    model.on('field.remove', function (delta) {
      let payload = {
        action: 'update',
        field: name + '.' + delta.field,
        old: delta.value,
        new: null,
        join: true,
        originalEvent: {
          event: 'field.remove',
          record: model
        }
      }

      me.emit('field.update', payload)
      me.emit('field.update.' + name + '.' + delta.field, payload)
    })

    model.on('field.invalid', function (data) {
      me.emit('field.invalid')
      me.emit('field.invalid.' + name + '.' + data.field)
    })

    model.on('field.valid', function (data) {
      me.emit('field.valid')
      me.emit('field.valid.' + name + '.' + data.field)
    })
  }

  /**
   * @method applyStoreMonitor
   * Applies event handlers for store data.
   * @param {string} name
   * Name of the raw join.
   * @private
   */
  applyStoreMonitor (name) {
    if (!this.rawjoins.hasOwnProperty(name)) {
      return
    }

    if (this.rawjoins[name] instanceof NGN.DATA.Store) { //this.rawjoins[name].hasOwnProperty('proxy')
      const me = this

      this.rawjoins[name].on('record.create', function (record) {
        let old = me[name].data
        old.pop()

        let c = {
          action: 'update',
          field: name,
          join: true,
          old: old,
          new: me[name].data,
          originalEvent: {
            event: 'record.create',
            record: record
          }
        }

        me.emit('field.update', c)
        me.emit('field.update.' + name, c)
      })

      this.rawjoins[name].on('record.update', function (record, delta) {
        if (!delta) {
          return
        }

        let c = {
          action: 'update',
          field: name + '.' + delta.field,
          join: true,
          old: delta.old,
          new: delta.new,
          originalEvent: {
            event: 'record.update',
            record: record
          }
        }

        me.emit('field.update', c)
        me.emit('field.update.' + name + '.' + delta.field, c)
      })

      this.rawjoins[name].on('record.delete', function (record) {
        let old = me[name].data
        old.push(record.data)

        let c = {
          action: 'update',
          field: name,
          join: true,
          old: old,
          new: me[name].data,
          originalEvent: {
            event: 'record.delete',
            record: record
          }
        }

        me.emit('field.update', c)
        me.emit('field.update.' + name, c)
      })

      this.rawjoins[name].on('record.invalid', function (data) {
        me.emit('field.invalid', data.field)
        me.emit('field.invalid.' + name, data.field)
      })

      this.rawjoins[name].on('record.valid', function (data) {
        me.emit('field.valid', data.field)
        me.emit('field.valid.' + name, data.field)
      })
    }
  }

  /**
   * @method removeField
   * Remove a field from the data model.
   * @param {string} name
   * Name of the field to remove.
   */
  removeField (name) {
    if (this.raw.hasOwnProperty(name)) {
      let val = this.raw[name]
      delete this[name]
      delete this.fields[name] // eslint-disable-line no-undef
      delete this.raw[name] // eslint-disable-line no-undef
      if (this.invalidDataAttributes.indexOf(name) >= 0) {
        this.invalidDataAttributes.splice(this.invalidDataAttributes.indexOf(name), 1)
      }
      let c = {
        action: 'delete',
        field: name,
        value: val
      }
      this.emit('field.remove', c)
      this.emit('changelog.append', c)
    }
  }

  /**
   * @method removeVirtual
   * Remove a virtual field.
   * @param {string} name
   * Name of the field.
   */
  removeVirtual (name) {
    delete this[name]
  }

  /**
   * @method removeRelationshipField
   * Remove an existing join dynamically.
   * @param {string} name
   * The name of the relationship field to remove.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is added.
   */
  removeRelationshipField (name, suppressEvents) {
    suppressEvents = suppressEvents !== undefined ? suppressEvents : false
    if (this.joins.hasOwnProperty(name)) {
      let val = this.rawjoins[name]
      delete this.rawjoins[name]
      delete this[name]
      delete this.joins[name]
      if (!suppressEvents) {
        let c = {
          action: 'delete',
          field: name,
          old: val,
          join: true
        }
        this.emit('changelog.append', c)
        this.emit('relationship.remove', c)
      }
    }
  }

  /**
   * @method hasVirtualField
   * Determines whether a virtual field is available.
   * @param {string} fieldname
   * The name of the virtual field to check for.
   * @returns {boolean}
   */
  hasVirtualField (fieldname) {
    return this.virtuals.hasOwnProperty(fieldname)
  }

  /**
   * @method setSilent
   * A method to set a field value without triggering an update event.
   * This is designed primarily for use with live update proxies to prevent
   * endless event loops.
   * @param {string} fieldname
   * The name of the #field to update.
   * @param {any} value
   * The new value of the field.
   * @private
   */
  setSilent (fieldname, value) {
    if (fieldname === this.idAttribute) {
      this.id = value
      return
    }

    // Account for nested models
    if (this.hasRelationship(fieldname)) {
      if (this[fieldname] instanceof NGN.DATA.Store) {
        this[fieldname].clear()
        this[fieldname].bulk(null, value)
        return
      }

      this[fieldname].load(value)

      return
    }

    this.raw[fieldname] = value
  }

  /**
   * @method undo
   * A rollback function to undo changes. This operation affects
   * the changelog. It is possible to undo an undo (i.e. redo).
   * This works with relationship creating/removing relationship fields,
   * but not updates to the related model. To undo changes to a relationship
   * field, the `undo()` method _of the related model_ must be called.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   */
  undo (back = 1) {
    let old = this.changelog.splice(this.changelog.length - back, back)
    const me = this

    old.reverse().forEach(function (change) {
      if (!(typeof change.join === 'boolean' ? change.join : false)) {
        switch (change.action) {
          case 'update':
            me[change.field] = change.old
            break
          case 'create':
            me.removeField(change.field)
            break
          case 'delete':
            me.addField(change.field)
            me[change.field] = me.old
            break
        }
      } else {
        switch (change.action) {
          case 'create':
            me.removeRelationshipField(change.field)
            break
          case 'delete':
            me.addRelationshipField(change.field)
            me[change.field] = change.old
            break
        }
      }
    })

    this.emit('changelog.remove', old.map((item) => {
      return item.id
    }))
  }

  /**
   * @method load
   * Load a data record. This clears the #history. #modified
   * will be set to `false`, as though the record has been untouched.
   * @param {object} data
   * The data to apply to the model.
   */
  load (data) {
    data = data || {}

    // Handle data maps
    if (this._dataMap !== null) {
      Object.keys(this.reverseMap).forEach((key) => {
        if (data.hasOwnProperty(key)) {
          data[this.reverseMap[key]] = data[key]
          delete data[key]
        }
      })
    }

    // Loop through the keys and add data fields
    Object.keys(data).forEach((key) => {
      if (this.hasDataField(key)) {
        if (this.raw.hasOwnProperty(key)) {
          this.raw[key] = data[key]
        } else if (key === this.idAttribute) {
          this.id = data[key]
        }
      } else if (this.hasRelationship(key)) {
        this.rawjoins[key].load(data[key])
      } else if (key !== this.idAttribute && !this.hasMetaField(key)) {
        try {
          const source = NGN.stack.pop()
          console.warn('%c' + key + '%c specified in %c' + source.path + '%c as a data field but is not defined in the model.', NGN.css, '', NGN.css, '')
        } catch (e) {
          console.warn('%c' + key + '%c specified as a data field but is not defined in the model.', NGN.css, '')
        }
      }
    })

    this.setUnmodified()
    this.emit('load')
  }
}

NGN.DATA = NGN.DATA || {}
// Object.defineProperty(NGN.DATA, 'Model', NGN.public(Entity))

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
