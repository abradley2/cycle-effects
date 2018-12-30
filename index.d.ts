import xs from 'xstream'

declare module '@abradley2/cycle-effects' {
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
}
