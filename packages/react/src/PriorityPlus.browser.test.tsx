import { render } from "vitest-browser-react";

import {
  installPriorityPlusBrowserStyles,
  priorityPlusBrowserItems,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import { PriorityPlus } from "./PriorityPlus";

testPriorityPlusBrowserBehavior(async () => {
  installPriorityPlusBrowserStyles();

  await render(
    <PriorityPlus
      aria-label="Main"
      classNames={{
        item: "test-item",
        overflow: "test-overflow",
        primary: "test-list",
        root: "test-nav",
        toggle: "test-toggle",
      }}
      getKey={(item) => item.href}
      items={priorityPlusBrowserItems}
      renderItem={(item) => (
        <a className="test-link" href={item.href}>
          {item.label}
        </a>
      )}
    />,
  );
});
