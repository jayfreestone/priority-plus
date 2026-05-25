class ContainerResizer extends HTMLElement {}

class ContainerResizerRange extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <input type="range" min="280" max="1080" value="860" step="10" aria-label="Nav container width">
    `;
  }
}

customElements.define("container-resizer", ContainerResizer);
customElements.define("container-resizer-range", ContainerResizerRange);
