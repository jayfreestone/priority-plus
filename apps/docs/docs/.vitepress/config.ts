import { defineConfig } from "vitepress";

const repo = "https://github.com/jayfreestone/priority-plus";

export default defineConfig({
  title: "priority-plus",
  description:
    "A modern Priority+ navigation library with a framework-agnostic core and small framework adapters.",
  lang: "en-US",
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
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
