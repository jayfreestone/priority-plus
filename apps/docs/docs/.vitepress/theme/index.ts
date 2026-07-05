import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import HomeSplash from "./HomeSplash.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("HomeSplash", HomeSplash);
  },
} satisfies Theme;
