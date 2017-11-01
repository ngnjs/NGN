(function () {
  // [INCLUDE: ./Model.js]
  // [INCLUDE: ./Index.js]
  // [INCLUDE: ./BTree.js]
  // [INCLUDE: ./Store.js]

  let NGNModel = function (cfg) {
    const ModelLoader = function (data) {
      let model = new NGNDataModel(cfg)

      if (data) {
        model.load(data)
      }

      return model
    }

    return ModelLoader
  }

  NGN.extend('DATA', Object.freeze(Object.defineProperties({}, {
    Entity: NGN.private(NGNDataModel),
    Model: NGN.const(NGNModel),
    'Index': NGN.const(NGNDataIndex),
    BTreeIndex: NGN.private(BTreeIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()
