var times = require('lowscore/times');
var limiter = require('..');
var expect = require('chai').expect;
var max = require('./max');

describe('promise-limit', function () {
  var output;
  var limit;

  beforeEach(function () {
    output = [];
    limit = limiter(5);
  });

  function wait(text, n) {
    output.push('starting', text);
    return new Promise(function (fulfil) {
      setTimeout(fulfil, n);
    }).then(function () {
      output.push('finished', text);
      return text;
    });
  }

  function expectMaxOutstanding(n) {
    var outstanding = 0;

    var outstandingOverTime = output.map(line => {
      if (line.match(/starting/)) {
        outstanding++;
      } else if (line.match(/finished/)) {
        outstanding--;
      }

      return outstanding;
    });

    var maxOutstanding = max(outstandingOverTime);
    expect(maxOutstanding).to.equal(n);
  }

  it('limits the number of outstanding calls to a function', function () {
    return Promise.all(times(9, i => {
      return limit(() => wait(`job ${i + 1}`, 100));
    })).then(() => {
      expectMaxOutstanding(5);
    });
  });

  it("doesn't limit if the number outstanding is the limit", function () {
    return Promise.all(times(5, i => {
      return limit(() => wait(`job ${i + 1}`, 100));
    })).then(() => {
      expectMaxOutstanding(5);
    });
  });

  it("doesn't limit if the number outstanding less than the limit", function () {
    return Promise.all(times(4, i => {
      return limit(() => wait(`job ${i + 1}`, 100));
    })).then(() => {
      expectMaxOutstanding(4);
    });
  });

  it('returns the results from each job', function () {
    return Promise.all(times(9, i => {
      return limit(() => wait(`job ${i + 1}`, 100));
    })).then(results => {
      expect(results).to.eql(times(9, i => `job ${i + 1}`));
    });
  });
});
