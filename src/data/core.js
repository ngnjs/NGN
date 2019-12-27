import NGN from '../core.js'
import UTILITY from './Utility.js'
import BTree from './index/BTree.js'
import TransactionLog from './TransactionLog.js'
import Rule from './rule/Rule.js'
import RangeRule from './rule/RangeRule.js'
import Field from './field/Field.js'
import VirtualField from './field/VirtualField.js'
import Relationship from './field/Relationship.js'
import FieldMap from './field/FieldMap.js'
import Entity from './Model.js'
import Index from './index/Index.js'
import Filter from './Filter.js'
import Store from './Store.js'

const Model = function (cfg) {
  if (NGN.typeof(cfg) !== 'object') {
    throw new Error('Model must be configured.')
  }

  const me = this

  const Model = function (data, suppressEvents = false) {
    const Entity = new NGN.DATA.Entity(cfg)

    Object.defineProperty(Entity, 'ENTITY', {
      enumerable: false,
      get () {
        return me
      }
    })

    if (data) {
      Entity.load(data, suppressEvents)
    }

    return Entity
  }

  Object.defineProperty(Model.prototype, 'CONFIGURATION', NGN.const(cfg))
  Object.defineProperty(Model.prototype, 'ENTITY', {
    enumerable: false,
    get () {
      return me
    }
  })

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
  Filter
}
