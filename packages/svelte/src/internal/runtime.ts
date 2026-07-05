export {
  createPriorityPlusSession,
  createPriorityPlusState,
  defaultToggleLabel,
  partitionItems,
  presentToggle,
  widestToggleState,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusOptions,
  type PriorityPlusState,
} from "@priority-plus/core";
export {
  contentInlineSize,
  readCachedMeasurements,
} from "@priority-plus/core/dom";

import type { PriorityPlusState } from "@priority-plus/core";

/** What the toggle snippet renders from. */
export interface PriorityPlusToggleState extends PriorityPlusState {
  /** Whether the overflow list is currently open. */
  open: boolean;
}
