/**
 * @class NGN.DATA.Representation
 * A data representation is a customized view of a model or
 * a store. Representations exist to format data from a model
 * or store in a manner suitable for a particular purpose.
 *
 * For example, a representation may need to calculate data
 * attributes differently for different purposes, such as API
 * output for a system or a website. Many API's utilize an `href`
 * data attribute that contains the base URL of the server plus
 * the ID of a model. The URL may only be known at runtime, making
 * it difficult to represent this attribute as a generic virtual
 * field.
 *
 * Representations can also be used to change the format entirely,
 * such as outputting data as XML instead of JSON.
 */
class NGNDataRepresentation extends NGN.EventEmitter { // eslint-disable-line
  /**
   * @method constructor
   * Create a new representation
   */
  constructor (cfg) {
    super()
  }
}
