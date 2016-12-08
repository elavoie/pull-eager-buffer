module.exports = function buffer () {
  var buffer = []
  var end = false
  var _cb = null

  function drain () {
    if (!_cb) return
    if (!end) return

    var cb = _cb
    _cb = null

    if (buffer.length >= 1) {
      return cb(null, buffer.shift())
    } else {
      return cb(end)
    }
  }

  return {
    sink: function (read) {
      read(end, function next (err, data) {
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
