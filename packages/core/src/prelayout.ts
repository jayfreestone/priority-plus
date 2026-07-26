import {
  getPriorityPlusState,
  inflateMeasurements,
  type PriorityPlusOptions,
  type PriorityPlusState,
} from "./calculate";
import { contentInlineSize, readCachedMeasurements } from "./dom";

export type PriorityPlusPrelayoutOptions = PriorityPlusOptions;

let prelayoutId = 0;

/**
 * Lay out server-rendered priority-plus markup before first paint, from a
 * render-blocking script placed directly after it:
 *
 * ```html
 * <nav data-priority-plus-primary=…>…</nav>
 * <script>priorityPlusPrelayout(document.currentScript.previousElementSibling)</script>
 * ```
 *
 * The SSR output renders every item in the primary list (the optimistic
 * all-visible seed) plus the hidden measurer, so this measures the exact
 * elements the adapter will measure after hydration and runs the same fit
 * calculation. It touches nothing the framework owns — not even an attribute,
 * which hydration would report as a mismatch. Instead it injects a stylesheet
 * (into `<head>`, which hydration tolerates) that hides the overflowed items
 * and reveals the toggle, scoped to the container by its position in the
 * document. Every rule is guarded by `:not([data-priority-plus-enhanced])`,
 * so the adapter's first measured layout (which renders that attribute)
 * neutralises them.
 *
 * The overflow itself stays unreachable until hydration: the toggle is inert
 * without the adapter. When nothing overflows — or when the expected markup
 * is missing or not laid out — this is a no-op.
 *
 * A parser-blocking script only runs once the parser reaches it, so when the
 * response is streamed the browser can paint a chunk boundary that falls before
 * the script. Render-block the document on an element *after* the script to
 * close that window — see the server rendering guide.
 *
 * @returns The computed state, or `null` when nothing could be measured.
 */
export function prelayout(
  container: Element | null | undefined,
  options: PriorityPlusPrelayoutOptions = {},
): PriorityPlusState | null {
  if (!(container instanceof HTMLElement)) return null;

  const primary = queryChild(container, "[data-priority-plus-primary]");
  const toggle = queryChild(container, "[data-priority-plus-toggle]");
  const measurer = queryChild(container, "[data-priority-plus-measurer]");
  const measureList =
    measurer && queryChild(measurer, "[data-priority-plus-primary]");
  const measureToggle =
    measurer && queryChild(measurer, "[data-priority-plus-toggle]");

  if (!primary || !toggle || !measureList || !measureToggle) return null;

  const available = contentInlineSize(container);
  if (available <= 0) return null;

  const state = getPriorityPlusState(
    inflateMeasurements(
      readCachedMeasurements({
        items: measureList.children,
        itemGapSource: measureList,
        container,
        toggle: measureToggle,
        primary,
      }),
      available,
    ),
    {
      collapseAtCount:
        options.collapseAtCount ??
        parseCount(container.getAttribute("data-priority-plus-collapse-at")),
    },
  );

  if (state.allVisible) return state;

  // The measurer's toggle twin shares the real toggle's classes but not its
  // `hidden` attribute, so its computed display is exactly what the real
  // toggle resolves to once revealed.
  const toggleDisplay = getComputedStyle(measureToggle).display;

  // Child combinators keep the rules off the measurer's twins, which are
  // nested one level deeper.
  const scope = `${positionSelector(container)}:not([data-priority-plus-enhanced])`;
  const style = container.ownerDocument.createElement("style");
  style.setAttribute("data-priority-plus-prelayout", String((prelayoutId += 1)));
  style.textContent = [
    `${scope} > [data-priority-plus-primary] > :nth-child(n + ${state.visibleCount + 1}) { display: none; }`,
    `${scope} > [data-priority-plus-toggle][hidden] { display: ${toggleDisplay}; }`,
  ].join("\n");
  container.ownerDocument.head.append(style);

  return state;
}

/**
 * A selector for the element's exact position in the document, e.g.
 * `html > :nth-child(2) > :nth-child(1)`. Scoping by position rather than by
 * a stamped attribute keeps the container's markup byte-identical to the
 * server output, so hydration has nothing to report. If later DOM changes
 * shift the position the rules simply stop matching — the same degradation
 * as not having run prelayout at all.
 */
function positionSelector(element: Element): string {
  const path: string[] = [];
  let node = element;

  for (
    let parent = node.parentElement;
    parent !== null;
    node = parent, parent = node.parentElement
  ) {
    const index = Array.prototype.indexOf.call(parent.children, node) + 1;
    path.unshift(`> :nth-child(${index})`);
  }

  return [node.localName, ...path].join(" ");
}

function queryChild(parent: Element, selector: string): HTMLElement | null {
  const match = parent.querySelector(`:scope > ${selector}`);
  return match instanceof HTMLElement ? match : null;
}

/** Parse a numeric attribute; absent, empty, or malformed values mean unset. */
function parseCount(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
