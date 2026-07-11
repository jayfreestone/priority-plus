import {
  createPriorityPlusSession,
  planPartition,
  presentToggle,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusLayoutResult,
  type PriorityPlusOptions,
  type PriorityPlusSession,
  type PriorityPlusState,
} from "@priority-plus/core";
import {
  contentInlineSize,
  readCachedMeasurements,
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

// Server-rendered module graphs evaluate this file too (the element is the
// progressive-enhancement adapter, so its import sits next to SSR'd markup).
// Off-DOM there is no HTMLElement to extend, so extend a stub: the class is
// constructible only in a browser, where connectedCallback does all the work.
const BaseElement = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

export class PriorityPlusElement extends BaseElement {
  static observedAttributes = ["collapse-at-count"];

  #elements?: ElementLookup;
  #items: HTMLElement[] = [];
  #mutationObserver?: MutationObserver;
  #observedContainer?: HTMLElement;
  #toggle?: HTMLElement;
  #connected = false;
  #fontsWatched = false;
  #open = false;
  #session: PriorityPlusSession = createPriorityPlusSession({
    readMeasurements: () => this.#readMeasurements(),
    getContainerInlineSize: () =>
      this.#elements === undefined
        ? null
        : contentInlineSize(this.#elements.container),
    onResult: (result) => this.#applyLayoutResult(result),
  });

  connectedCallback() {
    if (this.#connected) return;
    this.#connected = true;
    this.#session.setOptions(this.#readOptions());

    this.#observeMutations();
    this.#syncStructure({ layoutNow: true });

    // Web fonts changing metrics resize the live items, but only the container
    // is observed — re-measure once fonts settle. (#scheduleLayout is a no-op
    // if we have disconnected by then.)
    if (!this.#fontsWatched) {
      this.#fontsWatched = true;
      document.fonts?.ready.then(() =>
        this.#scheduleLayout({ refreshMeasurements: true }),
      );
    }
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#setToggle(undefined);
    this.#mutationObserver?.disconnect();
    this.#mutationObserver = undefined;
    this.#session.destroy();
    this.#observedContainer = undefined;
    // Forget the light DOM so a reconnect re-discovers it (and so layout
    // results delivered while disconnected have nothing to apply to).
    this.#elements = undefined;
    this.#items = [];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    if (name === "collapse-at-count") {
      this.#session.setOptions(this.#readOptions());
    }
  }

  refresh() {
    if (!this.#connected) return;

    this.#syncStructure();

    if (this.#elements === undefined) return;
    this.#scheduleLayout({ refreshMeasurements: true });
  }

  get allVisible(): boolean {
    return this.#session.getState().allVisible;
  }

  get itemCount(): number {
    return this.#session.getState().itemCount;
  }

  get open(): boolean {
    return this.#open;
  }

  get overflowCount(): number {
    return this.#session.getState().overflowCount;
  }

  get state(): Readonly<PriorityPlusState> {
    return { ...this.#session.getState() };
  }

  get visibleCount(): number {
    return this.#session.getState().visibleCount;
  }

  #syncStructure({ layoutNow = false } = {}) {
    const nextElements = this.#findElements();

    if (nextElements === undefined) {
      this.#elements = undefined;
      this.#items = [];
      this.#open = false;
      this.#setToggle(undefined);
      if (this.#observedContainer !== undefined) {
        this.#session.unobserve(this.#observedContainer);
        this.#observedContainer = undefined;
      }
      this.#session.reset(0);
      return;
    }

    const nextItems = getCurrentItems(nextElements);
    const elementsChanged = !elementsEqual(this.#elements, nextElements);
    const itemsChanged = !itemsEqual(this.#items, nextItems);

    this.#elements = nextElements;
    this.#items = nextItems;
    this.#setToggle(nextElements.toggle);

    if (elementsChanged || this.#observedContainer === undefined) {
      this.#observeContainer();
    }

    if (!elementsChanged && !itemsChanged) return;

    this.#open = false;

    if (layoutNow) {
      this.#session.layout({ refreshMeasurements: true });
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
    this.#mutationObserver ??= new MutationObserver(() => {
      if (this.#connected) {
        this.#syncStructure({ layoutNow: true });
      }
    });
    this.#mutationObserver.observe(this, { childList: true, subtree: true });
  }

  #observeContainer() {
    if (this.#elements === undefined) return;

    const { container } = this.#elements;
    if (this.#observedContainer === container) return;

    if (this.#observedContainer !== undefined) {
      this.#session.unobserve(this.#observedContainer);
    }
    this.#session.observe(container);
    this.#observedContainer = container;
  }

  #scheduleLayout({ refreshMeasurements = false } = {}) {
    if (!this.#connected) return;
    this.#session.schedule({ refreshMeasurements });
  }

  #readMeasurements(): PriorityPlusCachedMeasurements | undefined {
    const elements = this.#elements;
    if (elements === undefined) return undefined;

    const { primary, overflow, toggle, container } = elements;

    this.#moveAllItemsToPrimary();
    setHidden(toggle, false);

    const measurements = readCachedMeasurements({
      items: this.#items,
      itemGapSource: primary,
      container,
      toggle,
      primary,
    });

    setHidden(overflow, true);

    return measurements;
  }

  #applyLayoutResult(result: PriorityPlusLayoutResult) {
    // The cross-adapter "a measured layout has been applied" signal; a
    // render-blocking prelayout pass keys its interim styles off its absence.
    this.toggleAttribute("data-priority-plus-enhanced", result.state.measured);

    if (this.#elements === undefined) return;

    if (result.state.allVisible) {
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

    this.#reflectOpenState();
    this.#dispatchOverflowCountChange(result);
  }

  #partitionItems(
    previousVisibleCount: number,
    nextVisibleCount: number,
    { force = false } = {},
  ) {
    if (this.#elements === undefined) return;

    const { primary, overflow } = this.#elements;
    const plan = planPartition(
      previousVisibleCount,
      nextVisibleCount,
      this.#items.length,
      { force },
    );

    switch (plan.kind) {
      case "none":
        return;
      case "promote":
        primary.appendChild(this.#collectItems(plan.indices));
        return;
      case "demote":
        overflow.insertBefore(
          this.#collectItems(plan.indices),
          overflow.firstChild,
        );
        return;
      case "rebuild":
        primary.appendChild(this.#collectItems(plan.primary));
        overflow.appendChild(this.#collectItems(plan.overflow));
        return;
    }
  }

  #collectItems(indices: number[]): DocumentFragment {
    const fragment = document.createDocumentFragment();

    for (const index of indices) {
      const item = this.#items[index];
      if (item !== undefined) {
        fragment.appendChild(item);
      }
    }

    return fragment;
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
    this.#reflectOpenState();
  }

  #reflectOpenState() {
    if (this.#elements === undefined) return;

    const { overflow, toggle } = this.#elements;
    const view = presentToggle(this.#open, this.#session.getState());

    setHidden(toggle, view.toggleHidden);
    setHidden(overflow, view.overflowHidden);
    setAttribute(toggle, "aria-expanded", String(view.expanded));
  }

  #setToggle(toggle: HTMLElement | undefined) {
    if (this.#toggle === toggle) return;

    this.#toggle?.removeEventListener("click", this.#handleToggleClick);
    this.#toggle = toggle;

    if (this.#connected) {
      this.#toggle?.addEventListener("click", this.#handleToggleClick);
    }
  }

  #readOptions(): PriorityPlusOptions {
    return {
      collapseAtCount: parseCount(this.getAttribute("collapse-at-count")),
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

/** Parse a numeric attribute; absent, empty, or malformed values mean unset. */
function parseCount(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function definePriorityPlusElement(
  name = "priority-plus",
): CustomElementConstructor {
  // Off-DOM (SSR) there is no registry; return the class unregistered so the
  // import-time call below is a harmless no-op on the server.
  if (typeof customElements === "undefined") return PriorityPlusElement;

  const existing = customElements.get(name);
  if (existing !== undefined) return existing;

  // A constructor can only be registered once per registry, so each name gets
  // its own subclass; `instanceof PriorityPlusElement` holds for all of them.
  const element = class extends PriorityPlusElement {};
  customElements.define(name, element);
  return element;
}

definePriorityPlusElement();

declare global {
  interface HTMLElementTagNameMap {
    "priority-plus": PriorityPlusElement;
  }

  interface HTMLElementEventMap {
    "priority-plus:overflow-count-change": PriorityPlusOverflowCountChangeEvent;
  }
}
