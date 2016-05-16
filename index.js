module.exports = function (count, options) {
  if (typeof options !== 'object') {
    options = {
      abortOnError: false
    }
  }

  if (!count) {
    return function (fn) {
      return fn()
    }
  }
  var outstanding = 0
  var jobs = []

  function purgeRemainingJobs (err) {
    while (true) {
      if (!jobs.length) break
      jobs.shift().reject(err)
    }
  }

  function remove (err) {
    outstanding--

    if (err && options.abortOnError) {
      return purgeRemainingJobs(err)
    }

    if (outstanding < count) {
      dequeue()
    }
  }

  function dequeue () {
    var job = jobs.shift()

    if (job) {
      run(job.fn).then(job.resolve).catch(job.reject)
    }
  }

  function queue (fn) {
    return new Promise((resolve, reject) => {
      jobs.push({fn: fn, resolve: resolve, reject: reject})
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
        remove(error)
        throw error
      })
    } catch (err) {
      remove(err)
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

  return semaphore
}
