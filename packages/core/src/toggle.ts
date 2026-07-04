import type { PriorityPlusState } from "./state";

/**
 * How the toggle and overflow list should present, derived from the user's
 * open intent and the current state. Adapters store only the intent (did the
 * user ask to open?) in their own reactivity; everything rendered from it —
 * `aria-expanded`, the hidden flags, the "never open when everything is
 * visible" rule — is derived here so the adapters cannot drift apart.
 */
export interface PriorityPlusToggleView {
  /** Whether the overflow list is open — the value `aria-expanded` reflects. */
  expanded: boolean;
  /** Whether the toggle should be hidden (nothing overflows). */
  toggleHidden: boolean;
  /** Whether the overflow list should be hidden. */
  overflowHidden: boolean;
}

export function presentToggle(
  openIntent: boolean,
  state: PriorityPlusState,
): PriorityPlusToggleView {
  const expanded = openIntent && !state.allVisible;

  return {
    expanded,
    toggleHidden: state.allVisible,
    overflowHidden: !expanded,
  };
}

/** The default toggle label, clamped so a measurer never renders `More (0)`. */
export function defaultToggleLabel(state: PriorityPlusState): string {
  return `More (${Math.max(1, state.overflowCount)})`;
}

/**
 * The state a hidden measurer should render the toggle with: as if every item
 * had overflowed, so the fit calculation reserves room for the toggle at its
 * widest.
 */
export function widestToggleState(itemCount: number): PriorityPlusState {
  return {
    itemCount,
    visibleCount: 0,
    overflowCount: Math.max(1, itemCount),
    allVisible: false,
  };
}
