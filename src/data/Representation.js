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
   * @param {Object} [cfg={}]
   * The config contains stuff.
   * @param {Boolean} [bb=true] (test,blah)
   * das boolean
   * @fires {Object,test:String} eventguy
   * This is a strange name for an event.
   * @fires {String|Object} blerg
   * This is a strange name for an event.
   * @todo This buds for you
   * @todo This turd's for you
   * @todo This buds for you too
   * @todo This turd's for you two
   */
  constructor (cfg) {
    super()

    this.blahblah = true

    Object.defineProperties(this, {
      /**
       * @cfgproperty
       * X is a config value
       */
      x: NGN.public(true),
      /**
       * @property {boolean} nanananan
       * Batman!
       */
      y: NGN.define(true, false, false, 'test'),

      o: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 'obj'
      }
    })

    /**
     * @property {number} doesnotexist
     * This is a test
     */
    Object.defineProperty(this, {
      /**
       * @property {boolean} hot
       * dog
       */
      z: NGN.define(true, false, false, 'another test')
    })

    return 1
  }

  get mofo () {
    return false
  }

  /**
   * anotherFn description
   * @param {function} callback
   * This is an example callback.
   * @param {boolean} callback.a
   * The first element is a.
   * @param {boolean} callback.b (possible,values)
   * The next element is b.
   * @param somethingswonderful
   * something else
   */
  anotherFn () {
    this.emit('blerg', {some: 'value'})
let x = 'test'
    this.delayEmit('ablergy', 200, x)
NGN.BUS.emit('yo')
    this.emit(Symbol('test'), x)


    this.funnel(['a', 'b', 'c'], 'd')
    this.threshold('d', 3, 'THOLD', {blah: 1})

    this.deprecate('nomore', 'blerg')
    return
  }
}

/**
 * @error BadConfig
 * This is a baaaaad config.
 */
NGN.createException({
  name: 'InvalidConfigurationError',
  type: 'InvalidConfigurationError',
  severity: 'critical',
  message: 'Invalid configuration.',
  category: 'programmer',
  custom: {
    help: 'See the documentation for the proper configuration.',
    cause: 'The configuration specified was marked as invalid or caused an error during instantiation.'
  }
})
