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

/** Resolved inline space around the content box, in px. */
export const nonContentInlineSize = (element: HTMLElement): number => {
  const styles = getComputedStyle(element);
  return (
    toPx(styles.marginLeft) +
    toPx(styles.borderLeftWidth) +
    toPx(styles.paddingLeft) +
    toPx(styles.paddingRight) +
    toPx(styles.borderRightWidth) +
    toPx(styles.marginRight)
  );
};
