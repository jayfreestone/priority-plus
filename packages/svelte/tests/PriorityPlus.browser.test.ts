import { render } from "vitest-browser-svelte";

import {
  installPriorityPlusBrowserStyles,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import TestPriorityPlus from "./TestPriorityPlus.svelte";

testPriorityPlusBrowserBehavior(async () => {
  installPriorityPlusBrowserStyles();

  await render(TestPriorityPlus);
});
