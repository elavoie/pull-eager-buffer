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
