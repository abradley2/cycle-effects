const mitt = require('mitt')
const Events = mitt.default ? mitt.default : mitt
const xs = require('xstream').default

module.exports = function createEffectsDriver (simulate) {
  return (effects$) => {
    const emitter = new Events()

    const subscription = effects$.subscribe({
      next: function ({ run, ...config }) {
        const args = config.args || []
        const mock = typeof simulate === 'object' && (simulate[config.tag] || simulate[run.name]);

        (mock || run)(...args)
          .then(value => emitter.emit(config.tag, { value, error: null }))
          .catch(error => emitter.emit(config.tag, { value: null, error }))
      },
      complete: function () {
        subscription.unsubscribe()
      }
    })

    function select (tag = '*') {
      let sub
      return xs.create({
        start: function (listener) {
          sub = e => {
            listener.next(e)
          }
          emitter.on(tag, sub)
        },
        stop: function () {
          emitter.off(tag, sub)
        }
      })
    }

    function selectValue (tag) {
      return select(tag)
        .filter(({ error }) => error === null)
        .map(({ value }) => value)
    }

    function selectError (tag) {
      return select(tag)
        .filter(({ error }) => error !== null)
        .map(({ error }) => error)
    }

    return {
      select,
      selectValue,
      selectError
    }
  }
}
