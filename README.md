# Cycle Effects

`npm install --save @abradley2/cycle-effects`

### Purpose

When using Cycle, especially on the server, there's often need for a large amount of complex
drivers dealing with a large amount of side effects.

This library assumes you are using `xstream` and the default `@cycle/run`. If you
are interested in using this without another Reactive Programming library that Cycle
supports, please open an issue

## API

As with most other Cycle drivers, the API surface area is just a source and a sink.

The types are a good guidance on what is expected. See the Example Usage section for
a full, in-depth guide.

```
declare module '@abradley2/cycle-effects' {
  export type EffectSource<A> = (tag: string | symbol) => xstream<{
    value: A;
    error: Error;
  }>

  export type EffectSink<A> = xstream<{
    run: (args: any) => Promise<A>;
    args: any;
    tag: string | symbol;
  }>
}
```

### But isn't this running effects where we should be pure??

Actually, no. Similar to [Redux Loop](https://github.com/redux-loop/redux-loop) we are
only returning a side-effect causing function _to be_ executed by the runtime. This is why
we must supply an `args` property to the effect configuration in order to pass anything
to a function that creates side effects.

## Example Usage

The following application will first run an effect to get a random
number, and then run an effect that sets a timeout with a duration
based on that random number. Finally, that effects results in the name
"Tony" being sent through the result sink.

```
const xs = require('xstream').default
const createEffectsDriver = require('@abradley2/cycle-effects')

function application({effects}) {
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

const {sinks, run} = setup(application, { effects: createEffectsDriver() })

sinks.result
  .take(1)
  .subscribe({
    next: function (value) {
      console.log(value) // "Tony"
    }
  })
```