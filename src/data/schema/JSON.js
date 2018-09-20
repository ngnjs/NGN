import EventEmitter from '../../emitter/core'

/**
 * @class NGN.DATA.JSONSchema
 * Represents a JSON Schema.
 * @fires parsed
 * Triggered when the schema is parsed.
 */
export default class NGNJSONSchema extends EventEmitter { // eslint-disable-line no-unused-vars
  /**
   * Create a new JSON schema reference.
   * @param  {Object|String} [schema={}]
   * The schema to parse. This can be the JSON schema object itself or the URL
   * of a remote JSON schema.
   * @param  {NGN.NET.Resource} [NetworkResource]
   * Specify a custom network resource to make the request for a remote schema.
   */
  constructor (schema = {}, NetworkResource = null) {
    super()

    Object.defineProperties(this, {
      METADATA: NGN.private({
        schema,
        ID: null,
        name: null
      }),

      PRIVATE: NGN.privateconst({
        MODELS: null,
        NET: NGN.coalesce(NetworkResource, NGN.NET),

        parsed: false,

        /**
         * @method PRIVATE.extractCommonPropertyAttributes
         * @param  {object} property
         * Schema metadata object.
         * @param {array} [models=[]]
         * The list of known models. This is passed in because nested objects
         * may exist within a property. NGN identifies these as nested models,
         * even though the JSON schema does not force these to be separate
         * schemas.
         * @return {Object}
         * Returns a clean "NGN-ready" field object of common properties.
         */
        extractCommonPropertyAttributes: (property, models = []) => {
          let field = {}

          // Add pattern
          if (property.pattern) {
            field.pattern = property.pattern
          }

          // Add description
          if (property.description) {
            field.description = property.description
          }

          // Add default
          if (property.default) {
            field.default = property.default
          }

          if (!property.$ref) {
            if (!property.type) {
              field.type = String
            } else {
              let type = NGN.typeof(property.type) === 'array' ? 'array' : property.type.trim().toLowerCase()

              switch (type) {
                case 'string':
                  let format = NGN.coalesce(property.format, 'unknown').trim().toLowerCase()

                  field.type = String

                  switch (format) {
                    case 'date':
                    case 'date-time':
                    case 'datetime':
                    case 'format-time':
                      field.type = Date
                      break

                    case 'ipv4':
                      field.pattern = NGN.coalesce(
                        property.pattern,
                        /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/ // eslint-disable-line no-useless-escape
                      )

                      break

                    case 'ipv6':
                      field.pattern = NGN.coalesce(
                        property.pattern,
                        /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/ // eslint-disable-line no-useless-escape
                      )

                      break

                    case 'email':
                      field.pattern = NGN.coalesce(
                        property.pattern,
                        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b$/
                      )

                      break

                    case 'hostname':
                      field.pattern = NGN.coalesce(
                        property.pattern,
                        /^([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*)+(\.([a-zA-Z0-9]+(-[a-zA-Z0-9‌​]+)*))*$/ // eslint-disable-line no-irregular-whitespace
                      )

                      break

                    case 'uri':
                      field.pattern = NGN.coalesce(
                        property.pattern,
                        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/
                      )

                      break
                  }

                  break

                case 'integer':
                  field.type = Number
                  field.pattern = /^\d+$/
                  break

                case 'number':
                  field.type = Number
                  break

                case 'object':
                  if (property.properties) {
                    let subschema = new NGN.DATA.JSONSchema(property)

                    subschema.name = `${NGN.coalesce(this.name, 'untitled')}_${NGN.coalesce(subschema.name, 'submodel')}${models.length + 1}`

                    subschema.getModelDefinitions(definitions => {
                      definitions[definitions.length - 1].name = subschema.name
                      models = definitions.concat(models)
                    })

                    field = {
                      $model: subschema.name
                    }
                  } else {
                    field.type = Object
                  }

                  break

                default:
                  field.type = String
                  break
              }
            }
          }

          // String validation options
          if (field.type === String || field.type === Number) {
            if (NGN.coalesce(property.minLength, property.minimum)) {
              field.min = NGN.coalesce(property.minLength, property.minimum)
            }

            if (NGN.coalesce(property.maxLength, property.maximum)) {
              field.max = NGN.coalesce(property.maxLength, property.maximum)
            }

            // Numeric-specific validations
            if (property.type === Number) {
              if (property.multipleOf) {
                field.multipleOf = property.multipleOf
              }

              if (property.exclusiveMinimum) {
                field.min = (property.exclusiveMinimum + 0.00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001)
              }

              if (property.exclusiveMaximum) {
                field.max = (property.exclusiveMaximum - 0.00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001)
              }
            }
          }

          // Array validation options
          if (field.type === Array) {
            // Support minimum array length
            if (property.hasOwnProperty('minItems')) {
              field.min = property.minItems
            }

            // Support maximum array length
            if (property.hasOwnProperty('maxItems')) {
              field.max = property.maxItems
            }

            if (property.hasOwnProperty('items')) {
              if (NGN.typeof(property.items) === 'array') {
                // Apply tuple validation
                field.tuples = property.items
              } else {
                // Apply list validation
                if (property.items.hasOwnProperty('type')) {
                  field.listType = NGN.getType(property.items.type)
                }

                if (property.items.hasOwnProperty('enum')) {
                  field.enum = property.items.enum
                }
              }
            }
          }

          return field
        },

        /**
         * @method PRIVATE.extractModelDefinitions
         * Retrieve all of the NGN.DATA.Model defitions that can be interpreted
         * from this schema.
         * @protected
         * @private
         * @param  {Object} data
         * The schema object.
         * @param  {Array} [models=[]]
         * An array of known models. This method is used recursively, so this
         * argument exists primarily for internal use.
         * @param  {Function} callback
         * Executed when all models have been detected.
         */
        extractModelDefinitions: (data, models = [], callback) => {
          if (NGN.isFn(models)) {
            callback = models
            models = []
          }

          if (data.type === 'object') {
            let name = NGN.coalesce(data.name, this.name, 'Untitled')

            if (data.hasOwnProperty('$schema') && name === null && this.METADATA.URL) {
              name = this.METADATA.URL.split(/\/|\\/).pop().replace('.json', '')
            }

            // Configure the basic model
            let model = {
              name,
              description: NGN.coalesce(data.description, 'No description.'),
              fields: {}
            }

            // Flag the ID for the schema
            if (data.hasOwnProperty('$schema')) {
              this.METADATA.ID = NGN.coalesce(data.$id, data.$schema)
            }

            // Queue the tasks since several are async but sequential
            let tasks = new NGN.Queue()

            // If the allOf attribute exists, the schema is extending another.
            // Extract the subschema before continuing.
            if (data.hasOwnProperty('allOf')) {
              for (let i = 0; i < data.allOf.length; i++) {
                tasks.add(`Identify base schema: ${data.allOf}`, cont => {
                  let URI = NGN.coalesce(data.allOf[i].$ref, data.allOf[i].$schema)

                  if (URI !== null) {
                    // When a URI is specified, retrieve the remote schema
                    let baseSchema = new NGN.DATA.JSONSchema(URI)

                    baseSchema.getModelDefinitions(definitions => {
                      let coreModel = definitions.pop()

                      Object.assign(model.fields, coreModel.fields)

                      // If the nested schema has additional models, apply them.
                      if (definitions.length > 0) {
                        models = definitions.concat(models)
                      }

                      this.METADATA.name = NGN.coalesce(this.METADATA.name, coreModel.name)

                      cont()
                    })
                  } else if (data.allOf[i].hasOwnProperty('properties')) {
                    // Handle additional properties
                    let additionalProperties = Object.keys(data.allOf[i].properties)

                    for (let prop = 0; prop < additionalProperties.length; prop++) {
                      model.fields[additionalProperties[prop]] = this.extractCommonPropertyAttributes(data.allOf[i].properties[additionalProperties[prop]])
                    }

                    cont()
                  }
                })
              }
            }

            tasks.add('Identify attributes', cont => {
              // If the schema specifies dependencies, it is specifying a set of
              // rules requiring the existance and non-empty value of additional
              // fields. Create NGN.DATA.Rule sets to support this.
              if (data.hasOwnProperty('dependencies')) {
                Object.keys(data.dependencies).forEach(dependency => {
                  let requiredFields = null
                  let dep = data.dependencies[dependency]

                  if (NGN.typeof(dep) === 'array') {
                    // Simple property dependencies
                    requiredFields = dep
                  } else if (dep.hasOwnProperty('required')) {
                    // Schema dependencies
                    requiredFields = dep.required
                  }

                  // Add all valid dependencies as rules
                  if (requiredFields !== null) {
                    model.rules[`${dependency} dependency on "${requiredFields.join(', ')}"`] = function () {
                      if (NGN.coalesce(this[dependency]) !== null) {
                        for (let i = 0; i < requiredFields.length; i++) {
                          if (NGN.coalesce(this[requiredFields[i]]) === null) {
                            return false
                          }
                        }
                      }

                      return true
                    }
                  }
                })
              }

              // Identify the fields
              let properties = Object.keys(data.properties)
              let subtasks = new NGN.Queue()

              if (properties.length > 0) {
                for (let i = 0; i < properties.length; i++) {
                  let propertyName = properties[i]
                  let property = data.properties[propertyName]

                  model.fields[propertyName] = this.PRIVATE.extractCommonPropertyAttributes(property, models)

                  // If this is a subschema, retrieve it.
                  if (property.$ref) {
                    subtasks.add(next => {
                      let nestedModel = new NGN.DATA.JSONSchema(property.$ref)

                      nestedModel.getModelDefinitions(definitions => {
                        models = definitions.concat(models)

                        model.fields[propertyName] = {
                          $model: definitions[definitions.length - 1].name
                        }

                        next()
                      })
                    })
                  }

                  model.fields[propertyName].required = NGN.coalesce(data.required, '').indexOf(propertyName) >= 0
                }
              }

              subtasks.on('complete', () => {
                models.push(model)
                cont()
              })

              subtasks.run(true)
            })

            tasks.on('complete', () => callback(models))
            tasks.run(true)
          } else {
            callback(models)
          }
        }
      })
    })

    this.once('parsed', () => {
      this.PRIVATE.parsed = true
      this.METADATA.ID = NGN.coalesce(this.METADATA.schema.id, this.METADATA.schema.$schema)
    })

    // Initialize
    switch (NGN.typeof(schema)) {
      case 'string':
        // If schema is actually a URL, retrieve it.
        this.METADATA.URL = schema
        this.PRIVATE.NET.json(schema, (err, schema) => {
          if (err) {
            throw err
          }

          this.METADATA.schema = schema
          this.METADATA.name = NGN.coalesce(schema.name, this.METADATA.URL.split(/\/|\\/).pop().replace('.json', ''))

          this.emit('parsed')
        })

        break

      case 'object':
        this.METADATA.name = NGN.coalesce(schema.name, 'Untitled')
        this.emit('parsed')
        break

      default:
        throw new Error('Invalid schema definition.')
    }
  }

  get id () {
    if (this.METADATA.ID) {
      return this.METADATA.ID
    }

    let id = NGN.coalesce(this.METADATA.URL)

    if (id !== null) {
      return id
    }

    let root
    /* node-only */
    root = NGN.coalesce(this.PRIVATE.NET.baseUrl, `http://${require('os').hostname()}`)
    /* end-node-only */
    /* browser-only */
    root = NGN.coalesce(this.PRIVATE.NET.baseUrl, window.location.origin)
    /* end-browser-only */

    this.METADATA.ID = this.PRIVATE.NET.normalizeUrl(`${root}/${NGN.coalesce(this.name, 'untitled').toLowerCase()}.json`)

    return this.METADATA.ID
  }

  get name () {
    return this.METADATA.name
  }

  set name (value) {
    this.METADATA.name = NGN.coalesce(value, 'Untitled')
  }

  getModelDefinitions (callback) {
    if (!this.PRIVATE.parsed) {
      this.once('parsed', () => {
        this.getModelDefinitions(callback)
      })
    } else if (!this.PRIVATE.MODELS) {
      this.PRIVATE.extractModelDefinitions(this.METADATA.schema, [], definitions => {
        this.PRIVATE.MODELS = definitions
        callback(definitions)
      })
    } else {
      callback(this.PRIVATE.MODELS)
    }
  }
}
