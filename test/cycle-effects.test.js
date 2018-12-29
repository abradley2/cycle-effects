const test = require('tape')
const xs = require('xstream').default
const { setup } = require('@cycle/run')
const effectsDriver = require('../index.js')

function timeout (timeoutLen, value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), timeoutLen)
  })
}

function random () {
  return new Promise((resolve) => {
    resolve(Math.random() * 1000)
  })
}

const KENOBI = Symbol('Hello there')

const application = ({ effects }) => {
  const start = xs.of(1)

  const getRandom = Symbol('getRandom')
  const performTimeoutWait = Symbol('performTimeoutWait')

  const randomTimeout = effects(getRandom)
    .filter(v => !v.error)
    .map(v => v.value)
    .map((timeoutLen) => {
      return [
        timeout,
        {
          tag: performTimeoutWait,
          args: [timeoutLen, KENOBI]
        }
      ]
    })

  const timeoutDone = effects(performTimeoutWait)
    .filter(v => !v.error)
    .map(v => v.value)

  return {
    effects: xs.merge(
      start.map((v) => {
        return [
          random,
          { tag: getRandom }
        ]
      }),
      randomTimeout
    ),
    result: timeoutDone
  }
}

test('should run effects', (t) => {
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

test('example in the README should work', (t) => {
  t.plan(1)
  t.timeoutAfter(1100)
  function application ({ effects }) {
    const randomEffect = Symbol('randomEffect')
    const timeoutEffect = Symbol('timeoutEffect')

    return {
      effects: xs.merge(
        xs.of([
          () => new Promise((resolve) =>
            resolve(Math.random())
          ),
          { tag: randomEffect }
        ]),
        effects(randomEffect)
          .map((randomNum) => {
            return [
              (name, timeoutDuration) => new Promise((resolve) =>
                setTimeout(() => resolve(name), timeoutDuration)
              ),
              { tag: timeoutEffect, args: ['Tony', randomNum * 1000] }
            ]
          })
      ),
      result: effects(timeoutEffect)
        .filter((result) => !result.error)
        .map((result) => result.value)
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
