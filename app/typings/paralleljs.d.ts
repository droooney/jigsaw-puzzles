declare module 'paralleljs' {
  interface Options {

  }

  declare class Parallel<T> {
    constructor(data: T, opts?: Options);

    public spawn<U>(fn: (data: T) => U): Parallel<U>;
    public then(success: (data: T) => void, fail?: (e: Error) => void): Parallel<T>;
  }

  export = Parallel;
}
