import {
  getPriorityPlusState,
  throttle,
  type PriorityPlusOptions,
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

export class PriorityPlusElement extends HTMLElement {
  #elements!: ElementLookup;
  #items: HTMLElement[] = [];
  #containerInlineSize = 0;
  #resizeObserver?: ResizeObserver;
  #initialized = false;
  #open = false;
  #options: PriorityPlusOptions = {};

  connectedCallback() {
    if (this.#initialized) return;
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
    toggle.addEventListener("click", this.#handleToggleClick);

    this.#layout();
    this.#containerInlineSize = contentInlineSize(container);

    const onResize = throttle((entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      const inlineSize =
        entry?.contentRect.width ?? contentInlineSize(container);

      if (inlineSize === this.#containerInlineSize) return;

      this.#containerInlineSize = inlineSize;
      this.#layout();
    }, 50);

    this.#resizeObserver = new ResizeObserver(onResize);
    this.#resizeObserver.observe(container);

    document.fonts?.ready.then(() => this.#layout());
  }

  disconnectedCallback() {
    this.#elements?.toggle.removeEventListener("click", this.#handleToggleClick);
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
  }

  #layout() {
    const { primary, overflow, toggle, container } = this.#elements;

    this.#setOpen(false);

    for (const item of this.#items) {
      primary.appendChild(item);
    }

    toggle.hidden = false;

    const state = getPriorityPlusState(
      {
        itemWidths: this.#items.map((item) => item.getBoundingClientRect().width),
        itemGap: inlineGap(primary),
        containerGap: inlineGap(container),
        toggleWidth: toggle.getBoundingClientRect().width,
        available: contentInlineSize(container) - nonContentInlineSize(primary),
      },
      this.#options,
    );

    const primaryFragment = document.createDocumentFragment();
    const overflowFragment = document.createDocumentFragment();

    this.#items.forEach((item, index) => {
      (index < state.visibleCount ? primaryFragment : overflowFragment).appendChild(
        item,
      );
    });

    primary.appendChild(primaryFragment);
    overflow.appendChild(overflowFragment);

    toggle.hidden = state.allVisible;
    overflow.hidden = state.allVisible || !this.#open;
    toggle.setAttribute("aria-expanded", String(this.#open));
    toggle.textContent = `More${state.overflowCount > 0 ? ` (${state.overflowCount})` : ""}`;
  }

  #handleToggleClick = () => {
    this.#setOpen(!this.#open);
  };

  #setOpen(open: boolean) {
    this.#open = open;

    if (this.#elements === undefined) return;

    const { overflow, toggle } = this.#elements;
    const hasOverflow = overflow.children.length > 0;

    overflow.hidden = !hasOverflow || !this.#open;
    toggle.setAttribute("aria-expanded", String(this.#open && hasOverflow));
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
