import { defineConfig } from 'cypress'
import plugins from './cypress/plugins';

export default defineConfig({
  video: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on) {
      return plugins(on)
    },
    baseUrl: 'http://127.0.0.1:8000',
  },
})
