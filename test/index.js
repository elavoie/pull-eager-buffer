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
