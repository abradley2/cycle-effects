const Events = require('mitt')
const xs = require('xstream').default

module.exports = (simulate) => (effects$) => {
  const emitter = new Events()

  const unsub = effects$.subscribe({
    next: function ([runEffect, config]) {
      const args = config.args || []
      const mock = typeof simulate === 'object' &&
        (simulate[config.tag] || simulate[runEffect.name])

      ;(mock || runEffect)(...args)
        .then((result) => {
          emitter.emit(config.tag, { result, error: null })
        })
        .catch((error) => {
          emitter.emit(config.tag, { result: null, error })
        })
    },
    complete: function () {
      unsub()
    }
  })

  return function (tag) {
    let sub
    return xs.create({
      start: function (listener) {
        sub = (e) => {
          listener.next(e)
        }
        emitter.on(tag, sub)
      },
      stop: function () {
        emitter.off(tag, sub)
      }
    })
  }
}
