/* global describe, beforeEach, it */

var times = require('lowscore/times')
var limiter = require('..')
var expect = require('chai').expect
var max = require('./max')

describe('promise-limit', function () {
  var output
  var limit

  beforeEach(function () {
    output = []
    limit = limiter(5)
  })

  function wait (text, n) {
    output.push('starting', text)
    return new Promise(function (resolve, reject) {
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
    return Promise.all(times(9, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(5)
    })
  })

  it("doesn't limit if the number outstanding is the limit", function () {
    return Promise.all(times(5, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(5)
    })
  })

  it("doesn't limit if the number outstanding less than the limit", function () {
    return Promise.all(times(4, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then(() => {
      expectMaxOutstanding(4)
    })
  })

  it('returns the results from each job', function () {
    return Promise.all(times(9, (i) => {
      return limit(() => wait(`job ${i + 1}`, 100))
    })).then((results) => {
      expect(results).to.eql(times(9, (i) => `job ${i + 1}`))
    })
  })

  it('returns a rejected promise if the function throws an error', function () {
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
    var promise = limit(() => {
      return null
    })
    expect(promise).to.be.a('promise')
    return promise.then(function () {
      throw new Error('the promise resolved, instead of rejecting')
    }).catch(function (err) {
      expect(String(err)).to.equal('TypeError: Cannot read property \'then\' of null')
    })
  })

  it('should be able to settle queued promises with rejections', function () {
    var numbers = [1, 2, 3, 4, 5, 6]
    return Promise.all(numbers.map((i) => {
      return limit(() => {
        return new Promise((resolve, reject) => {
          if (i === 6) {
            setTimeout(() => {
              reject(new Error('rejected queued promise'))
            }, 100)
          } else {
            setTimeout(resolve, 100)
          }
        })
      })
    })).then(
      () => {
        throw new Error('all promises resolved, instead of one rejecting')
      },
      (err) => {
        expect(String(err)).to.equal('Error: rejected queued promise')
      }
    )
  })
})
