import { renderToString } from "react-dom/server";

import { App } from "./App";

/** Build-time server render; the postbuild script injects the result. */
export function render(): string {
  return renderToString(<App />);
}
