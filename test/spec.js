/* global describe, beforeEach, it */

var times = require('lowscore/times')
var limiter = require('..')
var expect = require('chai').expect
var max = require('./max')

describe('promise-limit', function () {
  var output

  beforeEach(function () {
    output = []
  })

  function wait (text, n) {
    output.push('starting', text)

    return new Promise(function (resolve) {
      setTimeout(resolve, n)
    }).then(function () {
      output.push('finished', text)
      return text
    })
  }

  function expectMaxOutstanding (n) {
    var outstanding = 0

    var outstandingOverTime = output.map((line) => {
      if (line.match(/starting/)) {
        outstanding++
      } else if (line.match(/finished/)) {
        outstanding--
      }

      return outstanding
    })

    var maxOutstanding = max(outstandingOverTime)
    expect(maxOutstanding).to.equal(n)
  }

  it('limits the number of outstanding calls to a function', function () {
    var limit = limiter(5)

    return Promise.all(times(9, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(5)
    })
  })

  it("doesn't limit if the number outstanding is the limit", function () {
    var limit = limiter(5)

    return Promise.all(times(5, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(5)
    })
  })

  it("doesn't limit if the number outstanding less than the limit", function () {
    var limit = limiter(5)

    return Promise.all(times(4, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(4)
    })
  })

  it('returns the results from each job', function () {
    var limit = limiter(5)

    return Promise.all(times(9, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then((results) => {
      expect(results).to.eql(times(9, (i) => `job ${i + 1}`))
    })
  })

  it('returns a rejected promise if the function throws an error', function () {
    var limit = limiter(5)

    var promise = limit(() => {
      throw new Error('uh oh')
    })
    expect(promise).to.be.a('promise')
    return promise.then(function () {
      throw new Error('the promise resolved, instead of rejecting')
    }).catch(function (err) {
      expect(String(err)).to.equal('Error: uh oh')
    })
  })

  it('returns a rejected promise if the function does not return a promise', function () {
    var limit = limiter(5)

    var promise = limit(() => {
      return null
    })
    expect(promise).to.be.a('promise')
    return promise.then(function () {
      throw new Error('the promise resolved, instead of rejecting')
    }).catch(function (err) {
      expect(String(err)).to.equal('Error: expected function to return a promise')
    })
  })

  it('should fulfil or reject when the function fulfils or rejects', function () {
    var limit = limiter(3)

    var numbers = [1, 2, 3, 4, 5, 6]

    function rejectOdd (n) {
      return new Promise((resolve, reject) => {
        if (n % 2 === 0) {
          resolve(n + ' is even')
        } else {
          reject(new Error(n + ' is odd'))
        }
      })
    }

    return Promise.all(numbers.map((i) => {
      return limit(() => rejectOdd(i)).then((r) => 'pass: ' + r, (e) => 'fail: ' + e.message)
    })).then((results) => {
      expect(results).to.eql([
        'fail: 1 is odd',
        'pass: 2 is even',
        'fail: 3 is odd',
        'pass: 4 is even',
        'fail: 5 is odd',
        'pass: 6 is even'
      ])
    })
  })

  it("doesn't limit if the limit is 0", function () {
    var limit = limiter(0)

    return Promise.all(times(9, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(9)
    })
  })

  it("doesn't limit if the limit is undefined", function () {
    var limit = limiter()

    return Promise.all(times(9, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(9)
    })
  })

  describe('queue length', function () {
    it('updates the queue length when there are more jobs than there is concurrency', function () {
      var limit = limiter(2)

      var one = limit(() => wait('one', 10))
      expect(limit.queue).to.equal(0)
      var two = limit(() => wait('two', 20))
      expect(limit.queue).to.equal(0)
      limit(() => wait('three', 100))
      expect(limit.queue).to.equal(1)
      limit(() => wait('four', 100))
      expect(limit.queue).to.equal(2)

      return one.then(() => {
        expect(limit.queue).to.equal(1)

        return two.then(() => {
          expect(limit.queue).to.equal(0)
        })
      })
    })
  })
})
