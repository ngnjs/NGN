(function () {
  // [INCLUDE: ./Utility.js]
  // [INCLUDE: ./TransactionLog.js]
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
    UTILITY: NGN.const(Utility),
    util: NGN.deprecate(Utility, 'NGN.DATA.util is now NGN.DATA.UTILITY'),
    TransactionLog: NGN.const(NGNTransactionLog),
    Rule: NGN.privateconst(NGNDataValidationRule),
    RangeRule: NGN.privateconst(NGNDataRangeValidationRule),
    Field: NGN.const(NGNDataField),
    VirtualField: NGN.const(NGNVirtualDataField),
    Relationship: NGN.const(NGNRelationshipField),
    Entity: NGN.privateconst(NGNDataModel),
    Model: NGN.const(NGNModel),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()
