const toPx = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const inlineGap = (element: Element): number => {
  const styles = getComputedStyle(element);
  return toPx(styles.columnGap || styles.gap);
};

export const contentInlineSize = (element: HTMLElement): number => {
  const styles = getComputedStyle(element);
  return (
    element.clientWidth -
    toPx(styles.paddingLeft) -
    toPx(styles.paddingRight)
  );
};

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
