import { createRoot, hydrateRoot } from "react-dom/client";

import { App } from "./App";

const root = document.getElementById("root");
const status = document.getElementById("status");
const requestedDelay = Number(
  new URLSearchParams(location.search).get("delay") ?? Number.NaN,
);
const delay = Number.isFinite(requestedDelay) && requestedDelay >= 0
  ? requestedDelay
  : 2000;

function setStatus(text: string): void {
  if (status !== null) status.textContent = text;
}

setStatus(
  `Bundle loaded at ${Math.round(performance.now())}ms — hydrating after another ${delay}ms…`,
);

setTimeout(() => {
  if (root === null) return;

  // The dev server has no pre-rendered markup to adopt; only the built
  // output exercises the SSR + prelayout path.
  if (root.firstElementChild === null) {
    createRoot(root).render(<App />);
    setStatus(
      `Client-rendered at ${Math.round(performance.now())}ms — run the build for the SSR + prelayout demo.`,
    );
    return;
  }

  hydrateRoot(root, <App />, {
    onRecoverableError(error) {
      console.error(error);
      setStatus("Hydration mismatch — see the console.");
    },
  });
  setStatus(`Hydrated at ${Math.round(performance.now())}ms.`);
}, delay);
