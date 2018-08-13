import UTILITY from './Utility'
import BTree from './index/BTree'
import JSONSchema from './schema/JSON'
import TransactionLog from './TransactionLog'
import Rule from './rule/Rule'
import RangeRule from './rule/RangeRule'
import Field from './field/Field'
import VirtualField from './field/VirtualField'
import Relationship from './field/Relationship'
import FieldMap from './field/FieldMap'
import Entity from './Model'
import Index from './index/Index'
import Store from './Store'

const Model = function (cfg) {
  if (NGN.typeof(cfg) !== 'object') {
    throw new Error('Model must be configured.')
  }

  let Model = function (data, suppressEvents = false) {
    let Entity = new NGN.DATA.Entity(cfg)

    if (data) {
      Entity.load(data, suppressEvents)
    }

    return Entity
  }

  Object.defineProperty(Model.prototype, 'CONFIGURATION', NGN.const(cfg))

  return Model
}

const util = NGN.deprecate(UTILITY, 'NGN.DATA.util is now NGN.DATA.UTILITY')

export {
  UTILITY,
  util,
  TransactionLog,
  Rule,
  RangeRule,
  Field,
  VirtualField,
  Relationship,
  FieldMap,
  Model,
  Entity,
  Index,
  Store,
  BTree,
  JSONSchema
}
