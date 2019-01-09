const test = require('tape')
const { setup } = require('@cycle/run')
const xs = require('xstream').default
const effectsDriver = require('../')

function timeout (timeoutLen, value) {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), timeoutLen)
  })
}

function random () {
  return new Promise(resolve => {
    resolve(Math.random() * 1000)
  })
}

const KENOBI = Symbol('Hello there')

const application = ({ effects }) => {
  const start = xs.of(1)

  const getRandom = Symbol('getRandom')
  const performTimeoutWait = Symbol('performTimeoutWait')

  const randomTimeout = effects.select(getRandom)
    .filter(v => !v.error)
    .map(v => v.value)
    .map(timeoutLen => {
      return {
        run: timeout,
        tag: performTimeoutWait,
        args: [timeoutLen, KENOBI]
      }
    })

  const timeoutDone = effects.select(performTimeoutWait)
    .filter(v => !v.error)
    .map(v => v.value)

  return {
    effects: xs.merge(
      start.map(() => {
        return { run: random, tag: getRandom }
      }),
      randomTimeout
    ),
    result: timeoutDone
  }
}

test('should run effects', t => {
  t.plan(1)
  t.timeoutAfter(1100)

  const { sinks, run } = setup(application, { effects: effectsDriver() })

  sinks.result
    .take(1)
    .subscribe({
      next: function (value) {
        t.equals(value, KENOBI)
      }
    })

  run()
})

test('example in the README should work', t => {
  t.plan(1)
  t.timeoutAfter(1100)
  function application ({ effects }) {
    const randomEffect = Symbol('randomEffect')
    const timeoutEffect = Symbol('timeoutEffect')

    return {
      effects: xs.merge(
        xs.of(
          {
            run: () => new Promise(resolve => resolve(Math.random())),
            tag: randomEffect
          }
        ),
        effects.select(randomEffect)
          .map(randomNum => {
            return {
              run: (name, timeoutDuration) => new Promise(resolve =>
                setTimeout(() => resolve(name), timeoutDuration)
              ),
              tag: timeoutEffect,
              args: ['Tony', randomNum * 1000]
            }
          })
      ),
      result: effects.select(timeoutEffect)
        .filter(result => !result.error)
        .map(result => result.value)
    }
  }

  const { sinks, run } = setup(application, { effects: effectsDriver() })

  sinks.result
    .take(1)
    .subscribe({
      next: function (value) {
        t.equals(value, 'Tony')
      }
    })

  run()
})

test('should be able to select values and errors', (t) => {
  t.plan(2)
  t.timeoutAfter(200)

  const value = Symbol('value')
  const shouldError = Symbol('shouldError')
  const shouldValue = Symbol('shouldValue')

  function app ({ effects }) {
    const effectSink = xs.fromArray([
      {
        tag: shouldError,
        run: () => {
          return Promise.reject(new Error('error'))
        },
        args: null
      },
      {
        tag: shouldValue,
        run: () => {
          return Promise.resolve(value)
        },
        args: null
      }
    ])

    return {
      effects: effectSink,
      result: xs.merge(
        effects.selectError(shouldError)
          .mapTo({ tag: shouldError }),
        effects.selectValue(shouldValue)
          .mapTo({ tag: shouldValue })
      )
    }
  }

  const { run, sinks } = setup(app, { effects: effectsDriver() })

  const results = {
    [shouldError]: 0,
    [shouldValue]: 0
  }
  sinks.result
    .take(2)
    .subscribe({
      next: function (result) {
        results[result.tag] = results[result.tag] + 1
      },
      complete: function () {
        t.isEqual(results[shouldError], 1)
        t.isEqual(results[shouldValue], 1)
      }
    })

  run()
})
