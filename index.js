module.exports = function (count) {
  if (!count) {
    return function (fn) {
      return fn()
    }
  }
  var outstanding = 0
  var jobs = []

  function remove () {
    outstanding--

    if (outstanding < count) {
      dequeue()
    }
  }

  function dequeue () {
    var job = jobs.shift()
    semaphore.queue = jobs.length

    if (job) {
      run(job.fn).then(job.resolve).catch(job.reject)
    }
  }

  function queue (fn) {
    return new Promise((resolve, reject) => {
      jobs.push({fn: fn, resolve: resolve, reject: reject})
      semaphore.queue = jobs.length
    })
  }

  function run (fn) {
    outstanding++
    try {
      var result = fn()

      if (!result || typeof result.then !== 'function') {
        throw new Error('expected function to return a promise')
      }

      return result.then(function (result) {
        remove()
        return result
      }, function (error) {
        remove()
        throw error
      })
    } catch (err) {
      remove()
      return Promise.reject(err)
    }
  }

  var semaphore = function (fn) {
    if (outstanding >= count) {
      return queue(fn)
    } else {
      return run(fn)
    }
  }

  semaphore.queue = 0

  return semaphore
}
