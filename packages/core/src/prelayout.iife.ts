import { prelayout } from "./prelayout";

declare global {
  interface Window {
    priorityPlusPrelayout: typeof prelayout;
  }
}

// The render-blocking build: loaded (or inlined) as a classic script, it
// exposes the prelayout entry point as a global for inline calls placed
// directly after server-rendered markup.
window.priorityPlusPrelayout = prelayout;
