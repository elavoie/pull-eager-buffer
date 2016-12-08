module.exports = function buffer () {
  var buffer = []
  var started = false
  var end = false // End of source data
  var _cb = null

  function drain () {
    if (!started) return
    if (!_cb) return

    var cb = _cb
    _cb = null

    if (buffer.length < 1) {
      return cb(end)
    } else {
      return cb(null, buffer.shift())
    }
  }

  return {
    sink: function (read) {
      read(end, function next (err, data) {
        started = true

        if (err) {
          end = err
          return drain()
        }

        buffer.push(data)
        read(end, next)
      })
    },
    source: function (abort, cb) {
      if (abort) {
        end = abort
        return cb(end)
      }

      _cb = cb
      drain()
    }
  }
}
