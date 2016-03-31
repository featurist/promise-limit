promise-limit [![npm version](https://img.shields.io/npm/v/promise-limit.svg)](https://www.npmjs.com/package/promise-limit) [![npm](https://img.shields.io/npm/dm/promise-limit.svg)](https://www.npmjs.com/package/promise-limit)
===

Limit outstanding calls to functions. You might want to do this to reduce load on external services, or reduce memory usage when processing large batches of jobs.

```sh
npm install promise-limit
```

```js
var promiseLimit = require('promise-limit')
var limiter = promiseLimit(2) // create and await a maximum of 2 promises at one time

var numbers = [1, 2, 3, 4, 5]

Promise.all(numbers.map((number) => {
  return limiter(() => {
    return new Promise((resolve, reject) => {
      var currentSecond = (new Date()).getSeconds()
      console.log(`called number ${number} at second ${currentSecond}`)
      setTimeout(() => resolve(number * 2), 5000)
    })
  })
})).then((newNumbers) => {
  console.log('all done')
  console.log(newNumbers)
})

// Output (assuming we start at second 30):
/*
called number 1 at second 30
called number 2 at second 30
called number 3 at second 35
called number 4 at second 35
called number 5 at second 40
all done
[2, 4, 6, 8, 10]
 */
```

API
---

`promiseLimit(concurrency) -> limiter`

Returns a function that does the limiting.

`limiter(fn) -> Promise`

Limiter function. Returns a promise that resolves or rejects when the Promise returned by the `fn` function resolves or rejects. At most `concurrency` calls to `fn` will be in progress at any point in time. When one call to `fn` has resolved or rejected, the next in queue will be executed.
