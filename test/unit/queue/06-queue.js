import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../../.node/index.js'

test('NGN.Queue Add Task', t => {
  const tasks = new NGN.Queue()

  tasks.add(function () {
    console.log('Task 1')
  })

  tasks.add('t2', function () {
    console.log('Task 2')
  })

  tasks.add(function () {
    console.log('Task 3')
  })

  t.ok(tasks.size === 3, 'Invalid number of steps queued. Expected: 3, Actual: ' + tasks.size)
  t.ok(tasks.list[0].name === 'Task #1', 'Autoname failed. Expected: Task #1, Actual: ' + tasks.list[1].name)
  t.ok(tasks.list[1].name === 't2', 'Invalid step name. Expected: t2, Actual: ' + tasks.list[1].name)
  t.end()
})

test('NGN.Queue Remove Task', t => {
  const tasks = new NGN.Queue()

  tasks.add(function () {
    console.log('Task 1')
  })

  tasks.add('t2', function () {
    console.log('Task 2')
  })

  tasks.add('t3', function () {
    console.log('Task 3')
  })

  let x = tasks.remove(1)
  t.ok(x.number === 2, 'Unrecognized task removed. Expected ID #2, Actual ID: ' + x.number)
  t.ok(tasks.list.length === 2, 'Invalid number of steps queued. Expected: 2, Actual: ' + tasks.list.length)
  t.ok(tasks.list[1].name === 't3', 'Invalid step name. Expected: t3, Actual: ' + tasks.list[1].name)
  x = tasks.remove('t3')
  t.ok(x.number === 3, 'Unrecognized task removed. Expected ID #3, Actual ID: ' + x.number)
  t.ok(tasks.list.length === 1, 'Invalid number of steps queued. Expected: 1, Actual: ' + tasks.list.length)
  t.ok(tasks.list[0].name === 'Task #1', 'Invalid step name. Expected: Step 1, Actual: ' + tasks.list[0].name)
  x = tasks.remove(0)
  t.ok(x.number === 1, 'Unrecognized task removed. Expected ID #1, Actual ID: ' + x.number)
  t.ok(tasks.size === 0, 'Invalid number of steps queued. Expected: None, Actual: ' + tasks.size)
  t.end()
})

test('NGN.Queue Retrieve a task.', t => {
  const tasks = new NGN.Queue()

  tasks.add(function () {
    console.log('Task 1')
  })

  tasks.add('t2', function () {
    console.log('Task 2')
  })

  tasks.add('t3', function () {
    console.log('Task 3')
  })

  let tsk = tasks.getTaskByIndex(1)
  t.ok(tsk.number === 2, 'tasks.getTaskByIndex method returned unexpected value. Expected number: 2, Received: ' + tsk.number)

  tsk = tasks.getTaskByName('t3')
  t.ok(tsk.number === 3, 'tasks.getTaskByName (by name) method returned unexpected value. Expected ID: 3, Received: ' + tsk.number)

  t.end()
})

test('NGN.Queue parallel execution.', t => {
  const tasks = new NGN.Queue()
  const x = []

  tasks.add(function () {
    x.push('Task 1')
  })

  tasks.add('t2', function () {
    x.push('Task 2')
  })

  tasks.add('t3', function () {
    x.push('Task 3')
  })

  tasks.on('complete', function () {
    console.log(x)
    t.ok(x.length === 3, 'Invalid result. Expected 3 items to run, recognized ' + x.length)
    t.end()
  })

  tasks.run()
})

// test('NGN.Queue Async execution.', {
//   timeout: 4000
// }, t => {
//   const tasks = new NGN.Queue()
//   const x = []

//   tasks.add(function () {
//     x.push('Task 1')
//   })

//   tasks.add('t2a', function (next) {
//     setTimeout(function () {
//       x.push('Task 2')
//       next()
//     }, 700)
//   })

//   tasks.add('t3', function () {
//     x.push('Task 3')
//   })

//   tasks.on('complete', function () {
//     t.ok(x.length === 3, 'Invalid result.' + x.toString())
//     t.end()
//   })

//   tasks.run()
// })

// test('NGN.Queue Process timeout.', {
//   timeout: 500
// }, t => {
//   const tasks = new NGN.Queue()
//   tasks.timeout = 0.00000000001

//   const x = []
//   tasks.add(function () {
//     x.push('Task 1')
//   })

//   tasks.add('t2', function (next) {
//     setTimeout(function () {
//       x.push('Task 2')
//       next()
//     }, 700)
//   })

//   tasks.on('timeout', function () {
//     t.pass('Timed out appropriately.')
//     t.end()
//   })

//   tasks.run()
// })

// test('NGN.Task timeout.', {
//   timeout: 3000
// }, t => {
//   const tasks = new NGN.Queue()
//   const x = []

//   tasks.add(function () {
//     x.push('Task 1')
//   })

//   tasks.add('t2', function (next) {
//     this.timeout(500)
//     setTimeout(function () {
//       x.push('Task 2')
//       next()
//     }, 2000)
//   })

//   tasks.on('tasktimeout', function () {
//     t.pass('Step times out appropriately.')
//     t.end()
//   })

//   tasks.run()
// })

// test('NGN.Queue Abort Process', {
//   timeout: 5000
// }, t => {
//   const tasks = new NGN.Queue()
//   let total = 0

//   for (let x = 0; x < 50; x++) {
//     tasks.add(function (next) {
//       setTimeout(function () {
//         total++
//         next()
//       }, 1000)
//     })
//   }

//   tasks.on('aborted', function () {
//     setTimeout(function () {
//       if (total !== 50) {
//         t.fail('Running steps were cancelled.')
//       }

//       t.ok(tasks.cancelled, 'Cancellation attribute populated correctly.')

//       t.pass('Successfully aborted process.')
//       t.end()
//     }, 2200)
//   })

//   setTimeout(function () {
//     tasks.abort()
//   }, 300)

//   tasks.run()
// })

// test('NGN.Queue Simple linear execution.', t => {
//   const tasks = new NGN.Queue()
//   const x = []

//   tasks.add(function () {
//     x.push(1)
//   })

//   tasks.add('t2', function () {
//     x.push(2)
//   })

//   tasks.add('t3', function () {
//     x.push(3)
//   })

//   tasks.on('complete', function () {
//     t.ok(x[0] === 1 && x[1] === 2 && x[2] === 3, 'Invalid result.' + x.toString())
//     t.end()
//   })

//   tasks.runSync()
// })

// test('NGN.Queue Asynchronous sequential execution.', t => {
//   const tasks = new NGN.Queue()
//   const x = []

//   tasks.add(function () {
//     x.push(1)
//   })

//   tasks.add('t2', function (next) {
//     setTimeout(function () {
//       x.push(2)
//       next()
//     }, 600)
//   })

//   tasks.add('t3', function () {
//     x.push(3)
//   })

//   const extra = tasks.add('t4', function () {
//     x.push(4)
//   })

//   extra.skip()

//   tasks.on('complete', function () {
//     t.ok(x.length === 3, 'Appropriately skipped step.')
//     t.ok(x[0] === 1 && x[1] === 2 && x[2] === 3, 'Invalid result.' + x.toString())
//     t.end()
//   })

//   tasks.runSync()
// })

// test('NGN.Queue Abort Process', {
//   timeout: 5000
// }, t => {
//   const tasks = new NGN.Queue()
//   let totalSync = 0

//   for (let x = 0; x < 50; x++) {
//     tasks.add(function (next) {
//       setTimeout(function () {
//         totalSync++
//         next()
//       }, 1000)
//     })
//   }

//   tasks.on('aborted', function () {
//     setTimeout(function () {
//       if (totalSync !== 1) {
//         t.fail('Queued steps were not cancelled.')
//       }

//       t.pass('Successfully aborted process.')
//       tasks.reset()

//       t.end()
//     }, 1500)
//   })

//   setTimeout(function () {
//     tasks.abort()
//   }, 300)

//   tasks.runSync()
// })

// test('NGN.Queue Process an empty queue.', t => {
//   const tasks = new NGN.Queue()
//   tasks.on('complete', function () {
//     t.pass('No error on empty task.')
//     tasks.reset()
//     t.end()
//   })

//   tasks.run()
// })
