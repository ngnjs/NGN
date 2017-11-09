(function () {
  // [INCLUDE: ./Rule.js]
  // [INCLUDE: ./RangeRule.js]
  // [INCLUDE: ./Field.js]
  // [INCLUDE: ./VirtualField.js]
  // [INCLUDE: ./Relationship.js]
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

  NGN.extend('DATA', NGN.const(Object.defineProperties({}, {
    Rule: NGN.privateconst(NGNDataValidationRule),
    RangeRule: NGN.privateconst(NGNDataRangeValidationRule),
    Field: NGN.const(NGNDataField),
    VirtualField: NGN.const(NGNVirtualDataField),
    Relationship: NGN.const(NgnRelationshipField),
    Entity: NGN.privateconst(NGNDataModel),
    Model: NGN.const(NGNModel),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()
