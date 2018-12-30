import xs from 'xstream'

declare module '@abradley2/cycle-effects' {
  export type EffectSource<A> = (tag: string | symbol) => xs<{
    value: A;
    error: Error;
  }>

  export type EffectSink<A> = xs<
    {
      run: (args: any) => Promise<A>;
      args: any;
      tag: string | symbol;
    }
  >
}

