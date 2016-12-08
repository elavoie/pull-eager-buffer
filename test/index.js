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

// TODO: Add more tests for testing various interleavings of
//       close events from both ends, with and without data inside
