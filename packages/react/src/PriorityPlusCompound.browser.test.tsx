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
    <PriorityPlus.Root
      aria-label="Main"
      render={(props) => <nav {...props} className="test-nav" />}
    >
      <PriorityPlus.Primary
        render={(props) => <ul {...props} className="test-list" />}
      >
        {priorityPlusBrowserItems.map((item, index) => (
          <PriorityPlus.Item
            id={item.href}
            key={item.href}
            order={index}
            render={(props) => (
              <li {...props} className="test-item">
                <a className="test-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            )}
          />
        ))}
      </PriorityPlus.Primary>

      <PriorityPlus.Trigger
        render={(props, state) => (
          <button {...props} className="test-toggle">
            More ({state.overflowCount})
          </button>
        )}
      />

      <PriorityPlus.Overflow
        render={(props) => <ul {...props} className="test-overflow" />}
      />
    </PriorityPlus.Root>,
  );
});
