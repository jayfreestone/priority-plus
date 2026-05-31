import {
  installPriorityPlusBrowserStyles,
  priorityPlusBrowserItems,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";

import "./index";

testPriorityPlusBrowserBehavior(async () => {
  installPriorityPlusBrowserStyles();

  document.body.innerHTML = `
    <priority-plus>
      <nav class="test-nav" aria-label="Main">
        <ul class="test-list" data-priority-plus-primary>
          ${priorityPlusBrowserItems
            .map(
              (item) =>
                `<li><a class="test-link" href="${item.href}">${item.label}</a></li>`,
            )
            .join("")}
        </ul>
        <button
          hidden
          class="test-toggle"
          data-priority-plus-toggle
          type="button"
          aria-expanded="false"
        >
          More
        </button>
        <ul
          hidden
          class="test-overflow"
          data-priority-plus-overflow
          id="test-overflow"
        ></ul>
      </nav>
    </priority-plus>
  `;

  await customElements.whenDefined("priority-plus");
});
