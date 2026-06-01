import type { PriorityPlusCachedMeasurements } from "./calculate";

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

export interface MeasurementSources {
  /** Items whose intrinsic widths should be read, in source order. */
  items: Iterable<Element> | ArrayLike<Element>;
  /** Element whose column gap defines the spacing between primary items. */
  itemGapSource: Element;
  /** Container whose column gap separates the primary list from the toggle. */
  container: HTMLElement;
  /** The overflow toggle, measured at its visible width. */
  toggle: Element;
  /** Primary list, used to subtract its own padding/border/margin. */
  primary: HTMLElement;
}

/**
 * Reads the DOM measurements the layout controller needs. Shared by every
 * adapter so the cached-measurement shape is built in exactly one place; each
 * adapter only decides which elements to point it at.
 */
export const readCachedMeasurements = ({
  items,
  itemGapSource,
  container,
  toggle,
  primary,
}: MeasurementSources): PriorityPlusCachedMeasurements => ({
  itemWidths: Array.from(items, (item) => item.getBoundingClientRect().width),
  itemGap: inlineGap(itemGapSource),
  containerGap: inlineGap(container),
  toggleWidth: toggle.getBoundingClientRect().width,
  primaryNonContentInlineSize: nonContentInlineSize(primary),
});
