// [PARTIAL]

/**
 * @class NGN.DATA.JSONSchema
 * Represents a JSON Schema.
 * @fires parsed
 * Triggered when the schema is parsed.
 */
class NGNJSONSchema extends NGN.EventEmitter { // eslint-disable-line no-unused-vars
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
        NET: NGN.coalesce(NetworkResource, NGN.NET)
      }),

      PRIVATE: NGN.privateconst({
        MODELS: null,

        parsed: false,

        extractModelDefinitions: (data, models = [], callback) => {
          if (data.type === 'object') {
            let name = NGN.coalesce(data.name, 'Untitled')

            if (data.$schema && name === 'Untitled' && this.METADATA.URL) {
              name = this.METADATA.URL.split(/\/|\\/).pop().replace('.json', '')
            }

            let model = {
              name,
              description: NGN.coalesce(data.description, 'No description.')
            }

            // Identify the fields
            let properties = Object.keys(data.properties)
            let tasks = new NGN.Tasks()

            if (properties.length > 0) {
              model.fields = {}

              for (let i = 0; i < properties.length; i++) {
                let propertyName = properties[i]
                let property = data.properties[propertyName]

                model.fields[propertyName] = {}

                // Add pattern
                if (property.pattern) {
                  model.fields[propertyName].pattern = property.pattern
                }

                // Add description
                if (property.description) {
                  model.fields[propertyName].description = property.description
                }

                // If this is a subschema, retrieve it.
                if (property.$ref) {
                  tasks.add(next => {
                    let nestedModel = new NGN.DATA.JSONSchema(property.$ref)

                    nestedModel.getModelDefinitions(definitions => {
                      models = definitions.concat(models)

                      model.fields[propertyName] = {
                        relationship: definitions[definitions.length - 1].name
                      }

                      next()
                    })
                  })
                } else if (!property.type) {
                  model.fields[propertyName].type = String
                } else {
                  let type = NGN.typeof(property.type) === 'array' ? 'array' : property.type.trim().toLowerCase()

                  switch (type) {
                    case 'string':
                      let format = NGN.coalesce(property.format, 'unknown').trim().toLowerCase()

                      model.fields[propertyName].type = String

                      switch (format) {
                        case 'date':
                        case 'date-time':
                        case 'datetime':
                        case 'format-time':
                          model.fields[propertyName].type = Date
                          break

                        case 'ipv4':
                          model.fields[propertyName].pattern = NGN.coalesce(
                            property.pattern,
                            /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/
                          )

                          break

                        case 'ipv6':
                          model.fields[propertyName].pattern = NGN.coalesce(
                            property.pattern,
                            /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/
                          )

                          break

                        case 'email':
                          model.fields[propertyName].pattern = NGN.coalesce(
                            property.pattern,
                            /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b$/
                          )

                          break

                        case 'uri':
                          model.fields[propertyName].pattern = NGN.coalesce(
                            property.pattern,
                            /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/
                          )

                          break

                      }

                      break

                    default:
                      model.fields[propertyName].type = String
                      break

                    case 'integer':
                    case 'number':
                      model.fields[propertyName].type = Number
                      break
                  }
                }

                model.fields[propertyName].required = NGN.coalesce(data.required, '').indexOf(propertyName) >= 0
              }
            }

            tasks.on('complete', () => {
              models.push(model)
              callback(models)
            })

            tasks.run(true)
          } else {
            callback(models)
          }
        }
      })
    })

    this.once('parsed', () => this.PRIVATE.parsed = true)

    // Initialize
    switch (NGN.typeof(schema)) {
      case 'string':
        // If schema is actually a URL, retrieve it.
        this.METADATA.URL = schema
        this.METADATA.NET.json(schema, (err, schema) => {
          if (err) {
            throw err
          }

          this.METADATA.schema = schema

          this.emit('parsed')
        })

        break

      case 'object':
        this.emit('parsed')
        break

      default:
        throw new Error('Invalid schema definition.')
    }
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
