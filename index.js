module.exports = function (count) {
  var outstanding = 0;
  var jobs = [];

  function remove() {
    outstanding--;

    if (outstanding < count) {
      dequeue();
    }
  }

  function dequeue() {
    var job = jobs.shift();

    if (job) {
      run(job.fn).then(job.finished);
    }
  }

  function queue(fn) {
    return new Promise(fulfil => {
      jobs.push({fn: fn, finished: fulfil});
    });
  }

  function run(fn) {
    outstanding++;
    try {
      var result = fn();

      return result.then(function (result) {
        remove();
        return result;
      }, function (error) {
        remove();
        throw error;
      });
    } catch(e) {
      remove();
      throw e;
    }
  }

  var semaphore = function (fn) {
    if (outstanding >= count) {
      return queue(fn);
    } else {
      return run(fn);
    }
  };

  return semaphore;
};
