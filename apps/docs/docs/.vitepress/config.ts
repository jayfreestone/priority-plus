import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitepress";

const repo = "https://github.com/jayfreestone/priority-plus";

// The homepage demo imports the real custom element. Alias the packages to
// their sources so docs dev/build never depends on the packages being built.
const packageSource = (path: string) =>
  fileURLToPath(new URL(`../../../../packages/${path}`, import.meta.url));

export default defineConfig({
  title: "priority-plus",
  description:
    "A modern Priority+ navigation library with a framework-agnostic core and small framework adapters.",
  lang: "en-US",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap",
      },
    ],
  ],

  vite: {
    resolve: {
      alias: [
        {
          find: /^priority-plus$/,
          replacement: packageSource("element/src/index.ts"),
        },
        {
          find: /^@priority-plus\/core\/dom$/,
          replacement: packageSource("core/src/dom.ts"),
        },
        {
          find: /^@priority-plus\/core\/prelayout$/,
          replacement: packageSource("core/src/prelayout.ts"),
        },
        {
          find: /^@priority-plus\/core$/,
          replacement: packageSource("core/src/index.ts"),
        },
      ],
    },
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === "priority-plus",
      },
    },
  },

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/what-is-priority-plus", activeMatch: "/guide/" },
      {
        text: "Adapters",
        activeMatch: "/adapters/",
        items: [
          { text: "React", link: "/adapters/react" },
          { text: "Svelte", link: "/adapters/svelte" },
          { text: "Custom Element", link: "/adapters/custom-element" },
          { text: "Core (build your own)", link: "/adapters/core" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Priority+?", link: "/guide/what-is-priority-plus" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Concepts",
          items: [
            { text: "How It Works", link: "/guide/how-it-works" },
            { text: "Options", link: "/guide/options" },
            { text: "Styling", link: "/guide/styling" },
            { text: "Server Rendering", link: "/guide/ssr" },
          ],
        },
        {
          text: "Adapters",
          items: [
            { text: "React", link: "/adapters/react" },
            { text: "Svelte", link: "/adapters/svelte" },
            { text: "Custom Element", link: "/adapters/custom-element" },
            { text: "Core", link: "/adapters/core" },
          ],
        },
      ],
      "/adapters/": [
        {
          text: "Adapters",
          items: [
            { text: "React", link: "/adapters/react" },
            { text: "Svelte", link: "/adapters/svelte" },
            { text: "Custom Element", link: "/adapters/custom-element" },
            { text: "Core", link: "/adapters/core" },
          ],
        },
        {
          text: "Guide",
          items: [
            { text: "How It Works", link: "/guide/how-it-works" },
            { text: "Options", link: "/guide/options" },
            { text: "Styling", link: "/guide/styling" },
            { text: "Server Rendering", link: "/guide/ssr" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: repo }],

    editLink: {
      pattern: `${repo}/edit/master/apps/docs/docs/:path`,
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the ISC License.",
      copyright: "Copyright © Jay Freestone",
    },
  },
});
