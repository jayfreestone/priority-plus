interface ElementLookup {
  primary: HTMLElement;
  overflow: HTMLElement;
  toggle: HTMLElement;
}

class PriorityPlus extends HTMLElement {
  #elements: ElementLookup;

  constructor() {
    super();

    this.#elements = {
      primary: this.#getElement("[data-priority-plus-primary]"),
      overflow: this.#getElement("[data-priority-plus-overflow]"),
      toggle: this.#getElement("[data-priority-plus-toggle]"),
    };
  }

  // TODO: Should probably validate the element types? Or maybe it's fine.
  #getElement(selector: string): HTMLElement {
    const element = this.querySelector(selector);

    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    return element as HTMLElement;
  }
}

customElements.define("priority-plus", PriorityPlus);
