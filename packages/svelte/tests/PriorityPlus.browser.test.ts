import { render } from "vitest-browser-svelte";

import {
  priorityPlusBrowserTest,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import TestPriorityPlus from "./TestPriorityPlus.svelte";

const sveltePriorityPlusTest = priorityPlusBrowserTest.override(
  "mountPriorityPlus",
  async () => async () => {
    render(TestPriorityPlus);
  },
);

testPriorityPlusBrowserBehavior(sveltePriorityPlusTest);
