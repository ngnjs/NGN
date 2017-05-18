'use strict'

var test = require('tape')

test('NGN.Tasks Sanity Checks', function (t) {
  t.ok(typeof NGN.Task === 'function', 'NGN.Task exists.')
  t.ok(typeof NGN.Tasks === 'function', 'NGN.Tasks exists.')
  t.end()
})

test('NGN.Tasks Add Task', function (t) {
  var tasks = new NGN.Tasks()

  tasks.add(function () {
    console.log('Task 1')
  })

  tasks.add('t2', function () {
    console.log('Task 2')
  })

  tasks.add(function () {
    console.log('Task 3')
  })

  t.ok(tasks.list.length === 3, 'Invalid number of steps queued. Expected: 3, Actual: ' + tasks.list.length)
  t.ok(tasks.list[0].name === 'Step 1', 'Autoname failed. Expected: Step 1, Actual: ' + tasks.list[1].name)
  t.ok(tasks.list[1].name === 't2', 'Invalid step name. Expected: t2, Actual: ' + tasks.list[1].name)
  t.end()
})

test('NGN.Tasks Remove Task', function (t) {
  var tasks = new NGN.Tasks()

  tasks.add(function () {
    console.log('Task 1')
  })

  tasks.add('t2', function () {
    console.log('Task 2')
  })

  tasks.add('t3', function () {
    console.log('Task 3')
  })

  var x = tasks.removeAt(1)
  t.ok(x.number === 2, 'Unrecognized task removed. Expected ID #2, Actual ID: ' + x.number)
  t.ok(tasks.list.length === 2, 'Invalid number of steps queued. Expected: 2, Actual: ' + tasks.list.length)
  t.ok(tasks.list[1].name === 't3', 'Invalid step name. Expected: t3, Actual: ' + tasks.list[1].name)
  x = tasks.remove('t3')
  t.ok(x.number === 3, 'Unrecognized task removed. Expected ID #3, Actual ID: ' + x.number)
  t.ok(tasks.list.length === 1, 'Invalid number of steps queued. Expected: 1, Actual: ' + tasks.list.length)
  t.ok(tasks.list[0].name === 'Step 1', 'Invalid step name. Expected: Step 1, Actual: ' + tasks.list[0].name)
  x = tasks.remove(1)
  t.ok(x.number === 1, 'Unrecognized task removed. Expected ID #1, Actual ID: ' + x.number)
  t.ok(tasks.list.length === 0, 'Invalid number of steps queued. Expected: None, Actual: ' + tasks.list.length)
  t.end()
})

test('NGN.Tasks Retrieve a task.', function (t) {
  var tasks = new NGN.Tasks()

  tasks.add(function () {
    console.log('Task 1')
  })

  tasks.add('t2', function () {
    console.log('Task 2')
  })

  tasks.add('t3', function () {
    console.log('Task 3')
  })

  var tsk = tasks.getAt(1)
  t.ok(tsk.number === 2, 'tasks.getAt method returned unexpected value. Expected ID: 2, Received: ' + t.number)
  tsk = tasks.get('t3')

  t.ok(tsk.number === 3, 'tasks.get (by name) method returned unexpected value. Expected ID: 3, Received: ' + t.number)
  tsk = tasks.get(2)

  t.ok(tsk.number === 2, 'tasks.get (by ID) method returned unexpected value. Expected ID: 2, Received: ' + t.number)

  t.end()
})

test('NGN.Tasks Simple linear execution.', function (t) {
  var tasks = new NGN.Tasks()
  var x = []

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
    t.ok(x.length === 3, 'Invalid result.' + x.toString())
    t.end()
  })

  tasks.process()
})

test('NGN.Tasks Async execution.', {
  timeout: 4000
}, function (t) {
  var tasks = new NGN.Tasks()
  var x = []

  tasks.add(function () {
    x.push('Task 1')
  })

  tasks.add('t2a', function (next) {
    setTimeout(function () {
      x.push('Task 2')
      next()
    }, 700)
  })

  tasks.add('t3', function () {
    x.push('Task 3')
  })

  tasks.on('complete', function () {
    t.ok(x.length === 3, 'Invalid result.' + x.toString())
    t.end()
  })

  tasks.process()
})

test('NGN.Tasks Process timeout.', {
  timeout: 500
}, function (t) {
  var tasks = new NGN.Tasks()
  tasks.timeout = 0.00000000001

  var x = []
  tasks.add(function () {
    x.push('Task 1')
  })

  tasks.add('t2', function (next) {
    setTimeout(function () {
      x.push('Task 2')
      next()
    }, 700)
  })

  tasks.on('timeout', function () {
    t.pass('Timed out appropriately.')
    t.end()
  })

  tasks.process()
})

test('NGN.Task timeout.', {
  timeout: 3000
}, function (t) {
  var tasks = new NGN.Tasks()
  var x = []

  tasks.add(function () {
    x.push('Task 1')
  })

  tasks.add('t2', function (next) {
    this.timeout(500)
    setTimeout(function () {
      x.push('Task 2')
      next()
    }, 2000)
  })

  tasks.on('tasktimeout', function () {
    t.pass('Step times out appropriately.')
    t.end()
  })

  console.log(tasks.list)

  tasks.process()
})

test('NGN.Tasks Abort Process', {
  timeout: 5000
}, function (t) {
  var tasks = new NGN.Tasks()
  var total = 0

  for (var x = 0; x < 50; x++) {
    tasks.add(function (next) {
      setTimeout(function () {
        total++
        next()
      }, 1000)
    })
  }

  tasks.on('aborted', function () {
    setTimeout(function () {
      if (total !== 50) {
        t.fail('Running steps were cancelled.')
      }

      t.pass('Successfully aborted process.')
      t.end()
    }, 2200)
  })

  setTimeout(function () {
    tasks.abort()
  }, 300)

  tasks.run()
})

test('NGN.Tasks Simple linear execution.', function (t) {
  var tasks = new NGN.Tasks()
  var x = []

  tasks.add(function () {
    x.push(1)
  })

  tasks.add('t2', function () {
    x.push(2)
  })

  tasks.add('t3', function () {
    x.push(3)
  })

  tasks.on('complete', function () {
    t.ok(x[0] === 1 && x[1] === 2 && x[2] === 3, 'Invalid result.' + x.toString())
    t.end()
  })

  tasks.process(true)
})

test('NGN.Tasks Asynchronous sequential execution.', function (t) {
  var tasks = new NGN.Tasks()
  var x = []

  tasks.add(function () {
    x.push(1)
  })

  tasks.add('t2', function (next) {
    setTimeout(function () {
      x.push(2)
      next()
    }, 600)
  })

  tasks.add('t3', function () {
    x.push(3)
  })

  tasks.on('complete', function () {
    t.ok(x[0] === 1 && x[1] === 2 && x[2] === 3, 'Invalid result.' + x.toString())
    t.end()
  })

  tasks.process(true)
})

test('NGN.Tasks Abort Process', {
  timeout: 5000
}, function (t) {
  var tasks = new NGN.Tasks()
  var totalSync = 0

  for (var x = 0; x < 50; x++) {
    tasks.add(function (next) {
      setTimeout(function () {
        totalSync++
        next()
      }, 1000)
    })
  }

  tasks.on('aborted', function () {
    setTimeout(function () {
      if (totalSync !== 1) {
        t.fail('Queued steps were not cancelled.')
      }

      t.pass('Successfully aborted process.')

      t.end()
    }, 1500)
  })

  setTimeout(function () {
    tasks.abort()
  }, 300)

  tasks.run(true)
})

test('NGN.Tasks Process an empty queue.', function (t) {
  var tasks = new NGN.Tasks()
  tasks.on('complete', function () {
    t.pass('No error on empty task.')
    t.end()
  })

  tasks.run()
})
