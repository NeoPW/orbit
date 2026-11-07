/**
 * One-shot requests to a part of the UI that may only mount after navigating (the focus field on Home, the complete
 * dialog or limit menu in focus mode). A request made before anyone listens waits for the first listener.
 */
export interface Request<T> {
  request: (value: T) => void;
  /** Calls `handler` for each request, including one that waited; returns the unsubscribe function. */
  subscribe: (handler: (value: T) => void) => () => void;
}

export function createRequest<T>(): Request<T> {
  let handler: ((value: T) => void) | null = null;
  let pending: { value: T } | null = null;
  return {
    request(value) {
      if (handler) handler(value);
      else pending = { value };
    },
    subscribe(next) {
      handler = next;
      if (pending) {
        const { value } = pending;
        pending = null;
        next(value);
      }
      return () => {
        if (handler === next) handler = null;
      };
    },
  };
}

/** Put the cursor in Home's focus field. */
export const focusFieldRequest = createRequest<void>();
/** Open the complete dialog or the time limit menu in focus mode. */
export const focusModeRequest = createRequest<'complete' | 'limit'>();
