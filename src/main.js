import NGN from './core.js'
import EventEmitter from './emitter/core.js'
import * as Queue from './queue/core.js'
import * as Utility from './utility/core.js'
import * as Network from './net/core.js'
import * as Data from './data/core.js'

// Add Event Emitter Class & Global Event Bus
NGN.extend('EventEmitter', NGN.public(EventEmitter))
NGN.extend('BUS', NGN.const(new EventEmitter()))

// Add Queuing System
NGN.extend('Task', NGN.const(Queue.Task))
NGN.extend('Queue', NGN.const(Queue.Queue))
NGN.extend('Tasks', NGN.deprecate(NGN.Queue, 'NGN.Tasks is now NGN.Queue'))

// Add Networking
NGN.extend('NET', NGN.const(Network.Library))

// Add Utilities
NGN.extend('UTILITY', NGN.const(Utility))

// Add Data Library
NGN.extend('DATA', NGN.const(Data))

// Add Name Management Utilities
Object.defineProperty(NGN, 'LABELS',
  NGN.privateconst({
    DATASTORES: new Utility.NameManager('Default NGN Data Store')
  })
)

NGN.BUS.on(NGN.INTERNAL_EVENT, function (eventName, payload) {
  switch (eventName.toLowerCase()) {
    case 'datastore.created':
      // payload is a datastore
      NGN.LABELS.DATASTORES.set(payload.name, payload)
      // NGN.INFO(`${payload.name} data store created.`)
      break
  }
})

export { NGN as default }
