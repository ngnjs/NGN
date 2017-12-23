(function () {
  // [INCLUDE: ./Utility.js]
  // [INCLUDE: ./TransactionLog.js]
  // [INCLUDE: ./Rule.js]
  // [INCLUDE: ./RangeRule.js]
  // [INCLUDE: ./Field.js]
  // [INCLUDE: ./VirtualField.js]
  // [INCLUDE: ./Relationship.js]
  // [INCLUDE: ./FieldMap.js]
  // [INCLUDE: ./Model.js]
  // [INCLUDE: ./Index.js]
  // [INCLUDE: ./Store.js]

  const NGNDataModel = function (cfg) {
    if (NGN.typeof(cfg) !== 'object') {
      throw new Error('Model must be configured.')
    }

    let Model = function (data) {
      let Entity = new NGN.DATA.Entity(cfg)

      if (data) {
        Entity.load(data)
      }

      return Entity
    }

    Object.defineProperty(Model.prototype, 'CONFIGURATION', NGN.const(cfg))

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
    FieldMap: NGN.privateconst(NGNDataFieldMap),
    Model: NGN.const(NGNDataModel),
    Entity: NGN.privateconst(NGNDataEntity),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()
