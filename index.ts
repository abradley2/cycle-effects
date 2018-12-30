import * as Events from 'mitt'
import xs from 'xstream'

export type EventSource<A> = (tag: string | symbol) => xs<{
  value: A;
  error: Error;
}>

export type EventSink<A> = xs<[
  (args: any) => Promise<A>,
  {
    args: any;
    tag: string | symbol;
  }
]>

export default function (simulate?: any): any {
	return (effects$): any => {
		const emitter = new Events()

		const unsub = effects$.subscribe({
			next: function ([runEffect, config]) {
				const args = config.args || []
				const mock = typeof simulate === 'object' && (simulate[config.tag] || simulate[runEffect.name]);

				(mock || runEffect)(...args)
					.then(value => {
						emitter.emit(config.tag, {value, error: null})
					})
					.catch(error => {
						emitter.emit(config.tag, {value: null, error})
					})
			},
			complete: function () {
				unsub()
			}
		})

		return function (tag: string) {
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
	}
}
