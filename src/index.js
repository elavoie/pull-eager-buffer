module.exports = function buffer () {
  var buffer = []
  var closed = false
  var _cb = null

  function dequeue () {
    if (_cb && buffer.length < 1 && closed) {
      return _cb(buffer.length < 1 && closed)
    }
    if (_cb && buffer.length >= 1) {
      var cb = _cb
      _cb = null
      return cb(null, buffer.shift())
    }
  }

  return {
    source: function (abort, cb) {
      _cb = cb
      if (abort) {
        closed = abort
        buffer = []
      }
      dequeue()
    },
    sink: function (read) {
      read(closed, function next (err, data) {
        if (err) {
          closed = err
          return dequeue()
        }

        buffer.push(data)
        read(err, next)
      })
    }
  }
}
