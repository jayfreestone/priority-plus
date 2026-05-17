import { calculateVisibleCount } from "./calculate";
import { contentInlineSize, inlineGap } from "./measure";

interface ElementLookup {
  primary: HTMLElement;
  overflow: HTMLElement;
  toggle: HTMLElement;
  container: HTMLElement;
}

class PriorityPlus extends HTMLElement {
  #elements!: ElementLookup;
  #items: HTMLElement[] = [];
  #frame = 0;
  #resizeObserver?: ResizeObserver;
  #initialized = false;

  connectedCallback() {
    if (this.#initialized) return;
    this.#initialized = true;

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

    this.#layout();

    this.#resizeObserver = new ResizeObserver(() => this.#scheduleLayout());
    this.#resizeObserver.observe(container);

    document.fonts?.ready.then(() => this.#scheduleLayout());
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    cancelAnimationFrame(this.#frame);
  }

  #scheduleLayout() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#layout());
  }

  #layout() {
    const { primary, overflow, toggle, container } = this.#elements;

    if (overflow.matches(":popover-open")) {
      overflow.hidePopover();
    }

    // Reset to a known state so we can measure intrinsic widths: every item
    // back in primary, toggle visible.
    for (const item of this.#items) {
      primary.appendChild(item);
    }
    toggle.hidden = false;

    const itemWidths = this.#items.map(
      (item) => item.getBoundingClientRect().width,
    );
    const visibleCount = calculateVisibleCount({
      itemWidths,
      itemGap: inlineGap(primary),
      containerGap: inlineGap(container),
      toggleWidth: toggle.getBoundingClientRect().width,
      available: contentInlineSize(container),
    });

    const primaryFragment = document.createDocumentFragment();
    const overflowFragment = document.createDocumentFragment();
    this.#items.forEach((item, index) => {
      (index < visibleCount ? primaryFragment : overflowFragment).appendChild(
        item,
      );
    });
    primary.appendChild(primaryFragment);
    overflow.appendChild(overflowFragment);

    toggle.hidden = visibleCount === this.#items.length;
  }

  #getElement(selector: string): HTMLElement {
    const element = this.querySelector(selector);
    if (!(element instanceof HTMLElement)) {
      throw new Error(`priority-plus: element not found: ${selector}`);
    }
    return element;
  }
}

customElements.define("priority-plus", PriorityPlus);
