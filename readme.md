# Promise Limit

Limit outstanding calls to functions. You might want to do this to reduce load on external services, or reduce memory usage when processing large batches of jobs.

```sh
npm install promise-limit
```

```js
var limit = require('promise-limit')(5);

var codes = [... very long list of codes ...];

Promise.all(codes.map(code => {
  return limit(() => {
    // at most 5 calls to this service will be in progress at any point in time.
    return httpism.get('http://example.com/api/' + code);
  });
}));
```

# limit

```js
var limiter = require('promise-limit');
var limit = limiter(n);
var promise = limit(() => operation());
```

At most `n` calls to `operation()` will be in progress at any point in time. When one call to `operation()` has completed, the next in the queue will be executed. `promise` will be fulfilled when the corresponding `operation()` has been executed, and will return the value returned by `operation()`.
