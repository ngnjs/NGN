(function () {
  // [INCLUDE: ./Model.js]
  // [INCLUDE: ./Index.js]
  // [INCLUDE: ./Store.js]

  let NGNModel = function (cfg) {
    const Model = function (data) {
      let model = new NGNDataModel(cfg)

      if (data) {
        model.load(data)
      }

      return model
    }

    return Model
  }

  NGN.extend('DATA', Object.freeze(Object.defineProperties({}, {
    Entity: NGN.privateconst(NGNDataModel),
    Model: NGN.const(NGNModel),
    'Index': NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()
