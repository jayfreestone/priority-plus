function createMirror() {
  const cache = new WeakMap();

  /**
   * Retrieves a Map of 'mirrored' elements, collected by index, e.g.
   * the comparable element in a different array that shares the same index.
   */
  return function getMirror(keyArr: HTMLElement[], valueArr: HTMLElement[]): Map<HTMLElement, HTMLElement> {
    if (!cache.get(keyArr)) {
      cache.set(
        keyArr,
        new Map(Array.from(keyArr).reduce((acc: any[], item, i) => (
          acc.concat([[item, valueArr[i]]])
        ), [])),
      );
    }

    return cache.get(keyArr);
  };
}

export default createMirror;
