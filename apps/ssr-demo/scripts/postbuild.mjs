// Turns the client build into the actual SSR demo page: injects the
// server-rendered app markup and inlines the prelayout classic script so the
// served HTML is exactly what a framework SSR server would emit.
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const htmlUrl = new URL("../dist/index.html", import.meta.url);

const { render } = await import(new URL("../dist-server/prerender.js", import.meta.url).href);

const prelayoutIife = await readFile(
  require.resolve("@priority-plus/core/prelayout.iife.js"),
  "utf8",
);

let html = await readFile(htmlUrl, "utf8");

for (const [placeholder, replacement] of [
  ["<!--app-html-->", render()],
  ["/*__PRELAYOUT_IIFE__*/", prelayoutIife],
]) {
  if (!html.includes(placeholder)) {
    throw new Error(`postbuild: placeholder ${placeholder} missing from dist/index.html`);
  }
  html = html.replace(placeholder, () => replacement);
}

await writeFile(htmlUrl, html);
console.log("postbuild: injected SSR markup and prelayout script into dist/index.html");
