import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // Vite dev server current port
    viewportWidth: 1280,
    viewportHeight: 720,
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      // Test environment variables
      apiUrl: 'http://localhost:8080',
      testDestination: 'Singapore, Singapore',
      testDestinationId: 'WD0M',
      testCheckIn: '2025-12-01',
      testCheckOut: '2025-12-07',
    }
  },
})
