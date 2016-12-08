var tape = require('tape')
var buffer = require('../')
var pull = require('pull-stream')

tape('eager buffering', function (t) {
  var actual = []
  var expected = [0, 1, 2, 0, 1, 2]

  pull(
    pull.count(2),
    pull.through(function (x) { actual.push(x) }),
    buffer(),
    pull.through(function (x) { actual.push(x) }),
    pull.drain(null, function () {
      t.deepEqual(actual, expected)
      t.end()
    })
  )
})

tape('early finish with take', function (t) {
  var actual = []
  var expected = [0, 1, 2]

  pull(
    pull.count(10),
    pull.take(3),
    buffer(),
    pull.through(function (x) { actual.push(x) }),
    pull.drain(null, function () {
      t.deepEqual(actual, expected)
      t.end()
    })
  )
})

tape('two eager buffers in sequence', function (t) {
  var actual = []
  var expected = [0, 1, 2, 0, 1, 2, 0, 1, 2]

  pull(
    pull.count(2),
    pull.through(function (x) { actual.push(x) }),
    buffer(),
    pull.through(function (x) { actual.push(x) }),
    buffer(),
    pull.through(function (x) { actual.push(x) }),
    pull.drain(null, function () {
      t.deepEqual(actual, expected)
      t.end()
    })
  )
})

tape('close buffer from the source', function (t) {
  var actual = []
  var expected = [0, 1, 2]

  pull(
    pull.count(5),
    buffer(),
    pull.take(3),
    pull.through(function (x) { actual.push(x) }),
    pull.drain(null, function () {
      t.deepEqual(actual, expected)
      t.end()
    })
  )
})

tape('draining while read is delayed', function (t) {
  var actual = []
  var expected = ['in:0', 'out:0', 'in:1', 'in:2',
    'out:1', 'in:3', 'out:2', 'out:3', 'in:null']

  var b = buffer()
  var _cb
  function sink (x) {
    actual.push('in:' + x)
    _cb((typeof x) !== 'number', x)
  }
  function drain () {
    function next (err, x) {
      if (err && err !== true) t.fail('unexpected error:' + err)
      if (err === true) {
        t.end()
      } else {
        actual.push('out:' + x)
      }
    }
    b.source(null, next)
  }

  b.sink(function read (abort, cb) {
    if (abort) t.fail('should not abort')
    _cb = cb
  })

  drain()

  sink(0)
  sink(1)
  sink(2)

  drain()

  sink(3)

  drain()
  drain()

  // Done sending values, end the source
  drain()
  sink(null)

  t.deepEqual(actual, expected)
})

tape('closing the buffer', function (t) {
  var _cb, b, _abort

  function expRead (expAbort) {
    t.equal(_abort, expAbort)
  }
  function sink (abort, x) {
    _cb(abort, x)
  }

  function expNext (expErr, expX) {
    return function next (err, x) {
      if (err && err !== true) t.fail('unexpected error:' + err)
      t.equal(err, expErr)
      if (!err) {
        t.equal(x, expX)
      }
    }
  }

  function drain (abort, expNext) {
    b.source(abort, expNext)
  }

  function setup () {
    b = buffer()
    b.sink(function read (abort, cb) {
      _abort = abort
      _cb = cb
    })
  }

  setup()
  expRead(false)
  sink(true)
  drain(null, expNext(true))

  setup()
  expRead(false)
  drain(null, expNext(true))
  sink(true)

  setup()
  expRead(false)
  drain(true, expNext(true))
  sink(true)

  setup()
  expRead(false)
  drain(true, expNext(true))
  sink(null, 1)
  expRead(true)
  drain(null, expNext(true))
  sink(null, 1)
  expRead(true)
  sink(null, 1)
  expRead(true)

  t.end()
})

tape('Testing various interleavings', function (t) {
  var _cb, b, _abort

  function expRead (expAbort) {
    t.equal(_abort, expAbort)
    _abort = undefined
  }
  function sink (abort, x) {
    _cb(abort, x)
  }

  var waiting = []
  function expNext (expErr, expX) {
    var next = function (err, x) {
      if (waiting.length < 1 || waiting[0] !== next) {
        t.fail('Invalid callback order resolution')
      } else {
        waiting.shift()
      }

      if (err && err !== true) t.fail('unexpected error:' + err)
      t.equal(err, expErr)
      if (!err) {
        t.equal(x, expX)
      }
    }

    waiting.push(next)
    return next
  }

  function drain (abort, expNext) {
    b.source(abort, expNext)
  }

  function setup () {
    b = buffer()
    b.sink(function read (abort, cb) {
      if (_abort !== undefined) {
        // Test that the previous value was false
        expRead(false)
      }
      _abort = abort
      _cb = cb
    })
  }

  function end () {
    if (waiting.length > 0) {
      t.fail('Unresolved callbacks')
    } else {
      t.end()
    }
  }

  setup()
  sink(true)
  drain(null, expNext(true))
  drain(null, expNext(true))

  setup()
  drain(true, expNext(true))
  sink(null, 1)
  expRead(true)

  setup()
  expRead(false)
  drain(true, expNext(true))
  sink(true)
  // read should not have been called
  // so the value should be undefined
  expRead(undefined)

  setup()
  drain(null, expNext(null, 1))
  sink(null, 1)
  expRead(false)
  sink(true)
  drain(null, expNext(true))
  expRead(undefined)

  setup()
  sink(null, 1)
  drain(null, expNext(null, 1))
  drain(null, expNext(true))
  expRead(false)
  sink(true)
  expRead(undefined)

  setup()
  sink(null, 1)
  drain(null, expNext(null, 1))
  sink(true)
  drain(null, expNext(true))
  drain(null, expNext(true))

  setup()
  sink(null, 1)
  sink(null, 2)
  sink(null, 3)
  drain(null, expNext(null, 1))
  sink(null, 4)
  sink(true)
  drain(null, expNext(null, 2))
  drain(null, expNext(null, 3))
  drain(null, expNext(null, 4))
  drain(null, expNext(true))

  setup()
  sink(null, 1)
  sink(null, 2)
  sink(null, 3)
  drain(null, expNext(null, 1))
  sink(null, 4)
  drain(null, expNext(null, 2))
  drain(null, expNext(null, 3))
  drain(null, expNext(null, 4))
  expRead(false)
  drain(null, expNext(true))
  // Drain should actually be waiting
  // for the sink to provide more values
  // or end the stream
  t.equal(waiting.length === 1, true)

  // Now it is properly done
  sink(true)

  end()
})
