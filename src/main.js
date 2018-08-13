import NGN from './core'
import EventEmitter from './emitter/core'
import * as Queue from './queue/core'
import * as Utility from './utility/core'
import * as Network from './net/core'
import * as Data from './data/core'

// Add Event Emitter Class & Global Event Bus
NGN.extend('EventEmitter', NGN.public(EventEmitter))
NGN.extend('BUS', NGN.const(new NGN.EventEmitter()))

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
