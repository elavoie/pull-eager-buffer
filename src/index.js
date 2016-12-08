module.exports = function buffer () {
  var buffer = []
  // End of source data
  var end = false
  // Buffer closed
  var closed = false
  var _cb = null

  function drain () {
    if (!_cb) return

    var cb
    if (buffer.length >= 1 && !closed) {
      cb = _cb
      _cb = null

      return cb(null, buffer.shift())
    } else if (closed) {
      cb = _cb
      _cb = null

      return cb(closed)
    } else if (end) {
      cb = _cb
      _cb = null

      closed = end
      return cb(end)
    }
  }

  return {
    sink: function (read) {
      read(closed, function next (err, data) {
        if (err) {
          end = err
          return drain()
        }

        buffer.push(data)
        drain()
        read(closed, next)
      })
    },
    source: function (abort, cb) {
      if (abort) {
        closed = end = abort
        return cb(closed)
      }

      _cb = cb
      drain()
    }
  }
}
