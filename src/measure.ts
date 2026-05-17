const toPx = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Resolved column-gap (or shorthand gap) of a flex/grid container, in px. */
export const inlineGap = (element: Element): number => {
  const styles = getComputedStyle(element);
  return toPx(styles.columnGap || styles.gap);
};

/** Inline size of an element's content box, in px. */
export const contentInlineSize = (element: HTMLElement): number => {
  const styles = getComputedStyle(element);
  return (
    element.clientWidth -
    toPx(styles.paddingLeft) -
    toPx(styles.paddingRight)
  );
};
