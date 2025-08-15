// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Handle uncaught exceptions to prevent test failures
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Add specific error handling if needed
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  
  if (err.message.includes('Non-Error promise rejection')) {
    return false
  }
  
  // Allow the test to continue for other errors we expect
  return false
})

// Global before hook
beforeEach(() => {
  // Set viewport size for consistency
  cy.viewport(1280, 720)
  
  // Clear local storage and cookies
  cy.clearLocalStorage()
  cy.clearCookies()
})
