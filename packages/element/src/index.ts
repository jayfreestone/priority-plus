import {
  createPriorityPlusState,
  getPriorityPlusState,
  type PriorityPlusMeasurements,
  type PriorityPlusOptions,
  type PriorityPlusState,
} from "@priority-plus/core";
import {
  contentInlineSize,
  inlineGap,
  nonContentInlineSize,
} from "@priority-plus/core/dom";

interface ElementLookup {
  primary: HTMLElement;
  overflow: HTMLElement;
  toggle: HTMLElement;
  container: HTMLElement;
}

interface CachedMeasurements
  extends Omit<PriorityPlusMeasurements, "available"> {
  primaryNonContentInlineSize: number;
}

export class PriorityPlusElement extends HTMLElement {
  static observedAttributes = ["collapse-at-count"];

  #elements!: ElementLookup;
  #items: HTMLElement[] = [];
  #state: PriorityPlusState = createPriorityPlusState();
  #measurements?: CachedMeasurements;
  #containerInlineSize = 0;
  #resizeObserver?: ResizeObserver;
  #initialized = false;
  #connected = false;
  #open = false;
  #options: PriorityPlusOptions = {};
  #scheduledLayoutFrame?: number;
  #scheduledMeasurementRefresh = false;
  #performanceMeasureId = 0;

  connectedCallback() {
    if (!this.#initialized) {
      this.#initialize();
    }

    if (this.#connected) return;
    this.#connected = true;

    this.#elements.toggle.addEventListener("click", this.#handleToggleClick);
    this.#layout({ refreshMeasurements: true });
    this.#observeContainer();

    document.fonts?.ready.then(() => {
      if (this.#connected) {
        this.#scheduleLayout({ refreshMeasurements: true });
      }
    });
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#elements?.toggle.removeEventListener("click", this.#handleToggleClick);
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    this.#cancelScheduledLayout();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    if (name === "collapse-at-count") {
      this.#options = this.#readOptions();

      if (this.#connected) {
        this.#scheduleLayout();
      }
    }
  }

  refresh() {
    if (!this.#connected) return;
    this.#scheduleLayout({ refreshMeasurements: true });
  }

  update() {
    this.refresh();
  }

  #initialize() {
    this.#initialized = true;
    this.#options = this.#readOptions();

    const primary = this.#getElement("[data-priority-plus-primary]");
    const overflow = this.#getElement("[data-priority-plus-overflow]");
    const toggle = this.#getElement("[data-priority-plus-toggle]");
    const container = primary.parentElement;

    if (!(container instanceof HTMLElement)) {
      throw new Error("priority-plus: primary list must have a parent element");
    }

    this.#elements = { primary, overflow, toggle, container };
    this.#items = Array.from(primary.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    this.#state = createPriorityPlusState(this.#items.length);
  }

  #observeContainer() {
    if (typeof ResizeObserver === "undefined") return;

    this.#resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const observedInlineSize = getObservedInlineSize(entry);
      const inlineSize =
        observedInlineSize ?? contentInlineSize(this.#elements.container);

      if (inlineSizesEqual(inlineSize, this.#containerInlineSize)) return;

      this.#containerInlineSize = inlineSize;
      this.#scheduleLayout();
    });
    this.#resizeObserver.observe(this.#elements.container);
  }

  #scheduleLayout({ refreshMeasurements = false } = {}) {
    if (!this.#connected) return;

    this.#scheduledMeasurementRefresh ||= refreshMeasurements;

    if (this.#scheduledLayoutFrame !== undefined) return;

    this.#scheduledLayoutFrame = requestAnimationFrame(() => {
      const shouldRefreshMeasurements = this.#scheduledMeasurementRefresh;
      this.#scheduledLayoutFrame = undefined;
      this.#scheduledMeasurementRefresh = false;

      this.#layout({ refreshMeasurements: shouldRefreshMeasurements });
    });
  }

  #cancelScheduledLayout() {
    if (this.#scheduledLayoutFrame !== undefined) {
      cancelAnimationFrame(this.#scheduledLayoutFrame);
    }

    this.#scheduledLayoutFrame = undefined;
    this.#scheduledMeasurementRefresh = false;
  }

  #layout({ refreshMeasurements = false } = {}) {
    this.#measurePerformance("priority-plus:layout", () => {
      const measurementsRefreshed =
        refreshMeasurements || this.#measurements === undefined;

      if (measurementsRefreshed) {
        this.#measurements = this.#readMeasurements();
      }

      const measurements = this.#measurements;
      if (measurements === undefined) return;

      const state = getPriorityPlusState(
        {
          itemWidths: measurements.itemWidths,
          itemGap: measurements.itemGap,
          containerGap: measurements.containerGap,
          toggleWidth: measurements.toggleWidth,
          available:
            this.#containerInlineSize -
            measurements.primaryNonContentInlineSize,
        },
        this.#options,
      );

      this.#applyState(state, { forcePartition: measurementsRefreshed });
    });
  }

  #readMeasurements(): CachedMeasurements {
    const { primary, overflow, toggle, container } = this.#elements;

    return this.#measurePerformance("priority-plus:measure", () => {
      this.#moveAllItemsToPrimary();
      setHidden(toggle, false);
      setText(toggle, getToggleLabel(Math.max(1, this.#items.length)));

      const measurements: CachedMeasurements = {
        itemWidths: this.#items.map((item) => item.getBoundingClientRect().width),
        itemGap: inlineGap(primary),
        containerGap: inlineGap(container),
        toggleWidth: toggle.getBoundingClientRect().width,
        primaryNonContentInlineSize: nonContentInlineSize(primary),
      };

      this.#containerInlineSize = contentInlineSize(container);
      setHidden(overflow, true);

      return measurements;
    });
  }

  #applyState(
    state: PriorityPlusState,
    { forcePartition = false } = {},
  ) {
    const previousState = this.#state;

    if (state.allVisible) {
      this.#open = false;
    }

    if (
      forcePartition ||
      previousState.visibleCount !== state.visibleCount ||
      previousState.itemCount !== state.itemCount
    ) {
      this.#partitionItems(previousState.visibleCount, state.visibleCount, {
        force: forcePartition,
      });
    }

    this.#state = state;

    const { overflow, toggle } = this.#elements;
    const hasOverflow = state.overflowCount > 0;

    setHidden(toggle, !hasOverflow);
    setHidden(overflow, !hasOverflow || !this.#open);
    setText(toggle, getToggleLabel(state.overflowCount));
    setAttribute(toggle, "aria-expanded", String(this.#open && hasOverflow));
  }

  #partitionItems(
    previousVisibleCount: number,
    nextVisibleCount: number,
    { force = false } = {},
  ) {
    const { primary, overflow } = this.#elements;
    const primaryFragment = document.createDocumentFragment();
    const overflowFragment = document.createDocumentFragment();

    if (!force) {
      if (nextVisibleCount > previousVisibleCount) {
        for (
          let index = previousVisibleCount;
          index < nextVisibleCount;
          index += 1
        ) {
          const item = this.#items[index];
          if (item !== undefined) {
            primaryFragment.appendChild(item);
          }
        }

        primary.appendChild(primaryFragment);
      } else {
        for (
          let index = nextVisibleCount;
          index < previousVisibleCount;
          index += 1
        ) {
          const item = this.#items[index];
          if (item !== undefined) {
            overflowFragment.appendChild(item);
          }
        }

        overflow.insertBefore(overflowFragment, overflow.firstChild);
      }

      return;
    }

    this.#items.forEach((item, index) => {
      (index < nextVisibleCount
        ? primaryFragment
        : overflowFragment
      ).appendChild(item);
    });

    primary.appendChild(primaryFragment);
    overflow.appendChild(overflowFragment);
  }

  #moveAllItemsToPrimary() {
    const fragment = document.createDocumentFragment();

    for (const item of this.#items) {
      fragment.appendChild(item);
    }

    this.#elements.primary.appendChild(fragment);
  }

  #handleToggleClick = () => {
    this.#setOpen(!this.#open);
  };

  #setOpen(open: boolean) {
    this.#open = open;

    if (this.#elements === undefined) return;

    const { overflow, toggle } = this.#elements;
    const hasOverflow = this.#state.overflowCount > 0;

    setHidden(overflow, !hasOverflow || !this.#open);
    setAttribute(toggle, "aria-expanded", String(this.#open && hasOverflow));
  }

  #measurePerformance<T>(name: string, callback: () => T): T {
    if (
      !this.hasAttribute("data-priority-plus-performance") ||
      typeof performance === "undefined" ||
      typeof performance.mark !== "function" ||
      typeof performance.measure !== "function"
    ) {
      return callback();
    }

    const id = `${name}:${this.#performanceMeasureId}`;
    const start = `${id}:start`;
    const end = `${id}:end`;
    this.#performanceMeasureId += 1;

    performance.mark(start);

    try {
      return callback();
    } finally {
      performance.mark(end);
      performance.measure(name, start, end);
      performance.clearMarks(start);
      performance.clearMarks(end);
    }
  }

  #getElement(selector: string): HTMLElement {
    const element = this.querySelector(selector);
    if (!(element instanceof HTMLElement)) {
      throw new Error(`priority-plus: element not found: ${selector}`);
    }
    return element;
  }

  #readOptions(): PriorityPlusOptions {
    const collapseAtCount = this.getAttribute("collapse-at-count");

    return {
      collapseAtCount:
        collapseAtCount === null ? undefined : Number(collapseAtCount),
    };
  }
}

function getToggleLabel(overflowCount: number): string {
  return `More${overflowCount > 0 ? ` (${overflowCount})` : ""}`;
}

function getObservedInlineSize(
  entry: ResizeObserverEntry | undefined,
): number | undefined {
  const contentBoxSize = entry?.contentBoxSize;
  const contentBox = Array.isArray(contentBoxSize)
    ? contentBoxSize[0]
    : contentBoxSize;

  return contentBox?.inlineSize ?? entry?.contentRect.width;
}

function inlineSizesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.5;
}

function setAttribute(
  element: HTMLElement,
  attribute: string,
  value: string,
): void {
  if (element.getAttribute(attribute) !== value) {
    element.setAttribute(attribute, value);
  }
}

function setHidden(element: HTMLElement, hidden: boolean): void {
  if (element.hidden !== hidden) {
    element.hidden = hidden;
  }
}

function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) {
    element.textContent = text;
  }
}

export function definePriorityPlusElement(
  name = "priority-plus",
): CustomElementConstructor {
  const existing = customElements.get(name);
  if (existing !== undefined) return existing;

  customElements.define(name, PriorityPlusElement);
  return PriorityPlusElement;
}

if (typeof customElements !== "undefined") {
  definePriorityPlusElement();
}
