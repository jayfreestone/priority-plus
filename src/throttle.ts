export type ThrottledCallback<Args extends unknown[]> = ((
  ...args: Args
) => void) & {
  cancel: () => void;
};

export function throttle<Args extends unknown[]>(
  callback: (...args: Args) => void,
  interval: number,
): ThrottledCallback<Args> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lastRun = 0;
  let pendingArgs: Args | undefined;

  const run = () => {
    lastRun = Date.now();
    timeout = undefined;

    if (pendingArgs === undefined) return;

    callback(...pendingArgs);
    pendingArgs = undefined;
  };

  const throttled = ((...args: Args) => {
    pendingArgs = args;

    const elapsed = Date.now() - lastRun;
    const remaining = interval - elapsed;

    if (lastRun === 0 || remaining <= 0) {
      if (timeout !== undefined) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      run();
      return;
    }

    timeout ??= setTimeout(run, remaining);
  }) as ThrottledCallback<Args>;

  throttled.cancel = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    timeout = undefined;
    pendingArgs = undefined;
  };

  return throttled;
}
