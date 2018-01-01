(function () {
  // [INCLUDE: ./Utility.js]
  // [INCLUDE: ./BTree.js]
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
    UTILITY: NGN.const(Utility), // eslint-disable-line no-undef
    util: NGN.deprecate(Utility, 'NGN.DATA.util is now NGN.DATA.UTILITY'), // eslint-disable-line no-undef
    TransactionLog: NGN.const(NGNTransactionLog), // eslint-disable-line no-undef
    Rule: NGN.privateconst(NGNDataValidationRule), // eslint-disable-line no-undef
    RangeRule: NGN.privateconst(NGNDataRangeValidationRule), // eslint-disable-line no-undef
    Field: NGN.const(NGNDataField), // eslint-disable-line no-undef
    VirtualField: NGN.const(NGNVirtualDataField), // eslint-disable-line no-undef
    Relationship: NGN.const(NGNRelationshipField), // eslint-disable-line no-undef
    FieldMap: NGN.privateconst(NGNDataFieldMap), // eslint-disable-line no-undef
    Model: NGN.const(NGNDataModel), // eslint-disable-line no-undef
    Entity: NGN.privateconst(NGNDataEntity), // eslint-disable-line no-undef
    Index: NGN.privateconst(NGNDataIndex), // eslint-disable-line no-undef
    Store: NGN.const(NGNDataStore), // eslint-disable-line no-undef
    BTree: NGN.privateconst(NGNBTree) // eslint-disable-line no-undef
  })))
})()
