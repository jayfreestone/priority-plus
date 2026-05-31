import {
  createPriorityPlusFrameScheduler,
  PriorityPlusLayoutController,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusLayoutResult,
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

export interface PriorityPlusOverflowCountChangeEventInit extends EventInit {
  overflowCount: number;
  previousOverflowCount: number;
  previousState: PriorityPlusState;
  state: PriorityPlusState;
}

export class PriorityPlusOverflowCountChangeEvent extends Event {
  static readonly eventName = "priority-plus:overflow-count-change";

  readonly overflowCount: number;
  readonly previousOverflowCount: number;
  readonly previousState: Readonly<PriorityPlusState>;
  readonly state: Readonly<PriorityPlusState>;

  constructor({
    overflowCount,
    previousOverflowCount,
    previousState,
    state,
    ...eventInit
  }: PriorityPlusOverflowCountChangeEventInit) {
    super(PriorityPlusOverflowCountChangeEvent.eventName, {
      bubbles: true,
      composed: true,
      ...eventInit,
    });

    this.overflowCount = overflowCount;
    this.previousOverflowCount = previousOverflowCount;
    this.previousState = { ...previousState };
    this.state = { ...state };
  }
}

export class PriorityPlusElement extends HTMLElement {
  static observedAttributes = ["collapse-at-count"];

  #elements?: ElementLookup;
  #items: HTMLElement[] = [];
  #controller = new PriorityPlusLayoutController();
  #containerInlineSize = 0;
  #mutationObserver?: MutationObserver;
  #resizeObserver?: ResizeObserver;
  #toggle?: HTMLElement;
  #connected = false;
  #open = false;
  #options: PriorityPlusOptions = {};
  #performanceMeasureId = 0;
  #scheduler = createPriorityPlusFrameScheduler((options) => {
    this.#layout(options);
  });

  connectedCallback() {
    if (this.#connected) return;
    this.#connected = true;
    this.#options = this.#readOptions();

    this.#observeMutations();
    this.#syncStructure({ layoutNow: true });

    document.fonts?.ready.then(() => {
      if (this.#connected) {
        this.#scheduleLayout({ refreshMeasurements: true });
      }
    });
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#setToggle(undefined);
    this.#mutationObserver?.disconnect();
    this.#mutationObserver = undefined;
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
      const result = this.#controller.setOptions(this.#options);

      if (this.#connected && this.#elements !== undefined) {
        this.#applyLayoutResult(result);
      }
    }
  }

  refresh() {
    if (!this.#connected) return;

    this.#syncStructure();

    if (this.#elements === undefined) return;
    this.#scheduleLayout({ refreshMeasurements: true });
  }

  update() {
    this.refresh();
  }

  get allVisible(): boolean {
    return this.#controller.getState().allVisible;
  }

  get itemCount(): number {
    return this.#controller.getState().itemCount;
  }

  get open(): boolean {
    return this.#open;
  }

  get overflowCount(): number {
    return this.#controller.getState().overflowCount;
  }

  get state(): Readonly<PriorityPlusState> {
    return { ...this.#controller.getState() };
  }

  get visibleCount(): number {
    return this.#controller.getState().visibleCount;
  }

  #syncStructure({ layoutNow = false } = {}) {
    const nextElements = this.#findElements();

    if (nextElements === undefined) {
      this.#elements = undefined;
      this.#items = [];
      this.#open = false;
      this.#setToggle(undefined);
      this.#resizeObserver?.disconnect();
      this.#resizeObserver = undefined;
      this.#containerInlineSize = 0;
      this.#controller = new PriorityPlusLayoutController(this.#options, 0);
      return;
    }

    const nextItems = getCurrentItems(nextElements);
    const elementsChanged = !elementsEqual(this.#elements, nextElements);
    const itemsChanged = !itemsEqual(this.#items, nextItems);

    this.#elements = nextElements;
    this.#items = nextItems;
    this.#setToggle(nextElements.toggle);

    if (elementsChanged || this.#resizeObserver === undefined) {
      this.#observeContainer();
    }

    if (!elementsChanged && !itemsChanged) return;

    this.#open = false;

    if (layoutNow) {
      this.#layout({ refreshMeasurements: true });
    } else {
      this.#scheduleLayout({ refreshMeasurements: true });
    }
  }

  #findElements(): ElementLookup | undefined {
    const primary = this.#queryElement("[data-priority-plus-primary]");
    const overflow = this.#queryElement("[data-priority-plus-overflow]");
    const toggle = this.#queryElement("[data-priority-plus-toggle]");
    const container = primary?.parentElement;

    if (
      primary === undefined ||
      overflow === undefined ||
      toggle === undefined ||
      !(container instanceof HTMLElement)
    ) {
      return undefined;
    }

    return { primary, overflow, toggle, container };
  }

  #queryElement(selector: string): HTMLElement | undefined {
    const elements = Array.from(this.querySelectorAll(selector));

    return elements.find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element.closest(this.localName) === this,
    );
  }

  #observeMutations() {
    if (
      this.#mutationObserver !== undefined ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }

    this.#mutationObserver = new MutationObserver(() => {
      if (this.#connected) {
        this.#syncStructure({ layoutNow: true });
      }
    });
    this.#mutationObserver.observe(this, { childList: true, subtree: true });
  }

  #observeContainer() {
    if (this.#elements === undefined || typeof ResizeObserver === "undefined") {
      return;
    }

    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;

    this.#resizeObserver = new ResizeObserver((entries) => {
      if (this.#elements === undefined) return;

      const entry = entries[0];
      const observedInlineSize = getObservedInlineSize(entry);
      const inlineSize =
        observedInlineSize ?? contentInlineSize(this.#elements.container);

      if (inlineSizesEqual(inlineSize, this.#containerInlineSize)) return;

      this.#containerInlineSize = inlineSize;
      this.#scheduler.schedule();
    });
    this.#resizeObserver.observe(this.#elements.container);
  }

  #scheduleLayout({ refreshMeasurements = false } = {}) {
    if (!this.#connected) return;
    this.#scheduler.schedule({ refreshMeasurements });
  }

  #cancelScheduledLayout() {
    this.#scheduler.cancel();
  }

  #layout({ refreshMeasurements = false } = {}) {
    if (this.#elements === undefined) return;

    this.#measurePerformance("priority-plus:layout", () => {
      const result = (() => {
        if (refreshMeasurements || !this.#controller.hasMeasurements) {
          const measurements = this.#readMeasurements();
          return measurements === undefined
            ? undefined
            : this.#controller.setMeasurements(
                measurements,
                this.#containerInlineSize,
              );
        }

        return this.#controller.setContainerInlineSize(
          this.#containerInlineSize,
        );
      })();

      if (result === undefined) return;

      this.#applyLayoutResult(result);
    });
  }

  #readMeasurements(): PriorityPlusCachedMeasurements | undefined {
    const elements = this.#elements;
    if (elements === undefined) return undefined;

    const { primary, overflow, toggle, container } = elements;

    return this.#measurePerformance("priority-plus:measure", () => {
      this.#moveAllItemsToPrimary();
      setHidden(toggle, false);

      const measurements: PriorityPlusCachedMeasurements = {
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

  #applyLayoutResult(result: PriorityPlusLayoutResult) {
    if (this.#elements === undefined) return;

    if (result.shouldCloseOverflow) {
      this.#open = false;
    }

    if (
      result.measurementsChanged ||
      result.visibleCountChanged ||
      result.itemCountChanged
    ) {
      this.#partitionItems(result.previousState.visibleCount, result.state.visibleCount, {
        force: result.measurementsChanged,
      });
    }

    const { overflow, toggle } = this.#elements;
    const hasOverflow = result.state.overflowCount > 0;

    setHidden(toggle, !hasOverflow);
    setHidden(overflow, !hasOverflow || !this.#open);
    setAttribute(toggle, "aria-expanded", String(this.#open && hasOverflow));
    this.#dispatchOverflowCountChange(result);
  }

  #partitionItems(
    previousVisibleCount: number,
    nextVisibleCount: number,
    { force = false } = {},
  ) {
    if (this.#elements === undefined) return;

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
    if (this.#elements === undefined) return;

    const fragment = document.createDocumentFragment();

    for (const item of this.#items) {
      fragment.appendChild(item);
    }

    this.#elements.primary.appendChild(fragment);
  }

  #dispatchOverflowCountChange(result: PriorityPlusLayoutResult) {
    if (!result.overflowCountChanged) return;

    this.dispatchEvent(
      new PriorityPlusOverflowCountChangeEvent({
        overflowCount: result.state.overflowCount,
        previousOverflowCount: result.previousState.overflowCount,
        previousState: result.previousState,
        state: result.state,
      }),
    );
  }

  #handleToggleClick = () => {
    this.#setOpen(!this.#open);
  };

  #setOpen(open: boolean) {
    this.#open = open;

    if (this.#elements === undefined) return;

    const { overflow, toggle } = this.#elements;
    const hasOverflow = this.#controller.getState().overflowCount > 0;

    setHidden(overflow, !hasOverflow || !this.#open);
    setAttribute(toggle, "aria-expanded", String(this.#open && hasOverflow));
  }

  #setToggle(toggle: HTMLElement | undefined) {
    if (this.#toggle === toggle) return;

    this.#toggle?.removeEventListener("click", this.#handleToggleClick);
    this.#toggle = toggle;

    if (this.#connected) {
      this.#toggle?.addEventListener("click", this.#handleToggleClick);
    }
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

  #readOptions(): PriorityPlusOptions {
    const collapseAtCount = this.getAttribute("collapse-at-count");

    return {
      collapseAtCount:
        collapseAtCount === null ? undefined : Number(collapseAtCount),
    };
  }
}

function getCurrentItems({ primary, overflow }: ElementLookup): HTMLElement[] {
  return [...primary.children, ...overflow.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
}

function elementsEqual(
  a: ElementLookup | undefined,
  b: ElementLookup,
): boolean {
  if (a === undefined) return false;

  return (
    a.primary === b.primary &&
    a.overflow === b.overflow &&
    a.toggle === b.toggle &&
    a.container === b.container
  );
}

function itemsEqual(a: readonly HTMLElement[], b: readonly HTMLElement[]) {
  return (
    a.length === b.length && a.every((item, index) => item === b[index])
  );
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
