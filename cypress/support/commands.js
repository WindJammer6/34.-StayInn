// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to search for hotels
Cypress.Commands.add('searchHotels', (destination, checkIn, checkOut, rooms = 1, guestsPerRoom = 2) => {
  // Fill in destination
  cy.get('input[placeholder="Type a city or hotel"]').clear().type(destination)
  
  // Wait for and select from dropdown
  cy.get('ul').contains(destination).should('be.visible').click()
  
  // Fill in check-in date
  cy.get('input[id="checkIn"]').clear().type(checkIn)
  
  // Fill in check-out date  
  cy.get('input[id="checkOut"]').clear().type(checkOut)
  
  // Set rooms and guests if different from defaults
  if (rooms !== 1) {
    const roomsToAdd = rooms - 1
    for (let i = 0; i < roomsToAdd; i++) {
      cy.get('button[aria-label="Increase rooms"]').click()
    }
  }
  
  if (guestsPerRoom !== 2) {
    const currentGuests = 2
    const guestsToChange = guestsPerRoom - currentGuests
    if (guestsToChange > 0) {
      for (let i = 0; i < guestsToChange; i++) {
        cy.get('button[aria-label="Increase guests per room"]').click()
      }
    } else if (guestsToChange < 0) {
      for (let i = 0; i < Math.abs(guestsToChange); i++) {
        cy.get('button[aria-label="Decrease guests per room"]').click()
      }
    }
  }
  
  // Click search button
  cy.contains('button', 'Search').click()
})

// Custom command to apply filters
Cypress.Commands.add('applyPriceFilter', (priceRange) => {
  cy.get('input[type="checkbox"]').siblings('span').contains(priceRange).click()
  cy.contains('button', 'Apply filters').click()
})

Cypress.Commands.add('applyStarRatingFilter', (starRating) => {
  if (starRating === 'Any rating') {
    cy.contains('label', 'Any rating').click()
  } else {
    cy.contains('label', `${'★'.repeat(starRating)}+`).click()
  }
  cy.contains('button', 'Apply filters').click()
})

Cypress.Commands.add('applyGuestRatingFilter', (guestRating) => {
  if (guestRating === 'Any rating') {
    cy.contains('label', 'Any rating').click()
  } else {
    cy.contains('label', `${guestRating}+`).click()
  }
  cy.contains('button', 'Apply filters').click()
})

// Custom command to sort hotels
Cypress.Commands.add('sortHotels', (sortOption) => {
  cy.get('select#sort').select(sortOption)
})

// Custom command to wait for hotels to load
Cypress.Commands.add('waitForHotelsToLoad', () => {
  cy.get('[data-testid="hotel-card"]', { timeout: 20000 }).should('exist')
  cy.contains('Loading hotels').should('not.exist')
})

// Custom command to stub API calls for testing
Cypress.Commands.add('stubHotelAPIs', () => {
  // Stub hotel details API
  cy.intercept('GET', '**/api/hotels?destination_id=*', {
    fixture: 'hotels.json'
  }).as('getHotels')
  
  // Stub hotel prices API
  cy.intercept('GET', '**/api/hotels/prices?*', {
    fixture: 'prices.json'
  }).as('getPrices')
})

// Custom command to navigate to a specific hotel
Cypress.Commands.add('selectHotel', (hotelName) => {
  cy.contains('[data-testid="hotel-card"]', hotelName).within(() => {
    cy.contains('button', 'See Availability').click()
  })
})

// Custom command to fill guest details form
// NOTE: Commented out due to booking form not being implemented
/*
Cypress.Commands.add('fillGuestDetails', () => {
  cy.get('input[name="firstName"]').type('John')
  cy.get('input[name="lastName"]').type('Doe')
  cy.get('input[name="emailAddress"]').type('john.doe@example.com')
  cy.get('input[name="phoneNumber"]').type('+6512345678')
  cy.get('select[name="salutation"]').select('Mr.')
  cy.get('textarea[name="specialRequests"]').type('Late check-in requested')
})
*/

// Custom command to fill billing address form
// NOTE: Commented out due to booking form not being implemented
/*
Cypress.Commands.add('fillBillingAddress', () => {
  cy.get('input[name="billingFirstName"]').type('John')
  cy.get('input[name="billingLastName"]').type('Doe')
  cy.get('input[name="billingEmailAddress"]').type('john.doe@example.com')
  cy.get('input[name="billingPhoneNumber"]').type('+6512345678')
  cy.get('select[name="country"]').select('Singapore')
  cy.get('input[name="stateProvince"]').type('Central Region')
  cy.get('input[name="postalCode"]').type('018956')
})
*/

// Custom command to fill payment details (Stripe test card)
// NOTE: Commented out due to booking form not being implemented
/*
Cypress.Commands.add('fillPaymentDetails', () => {
  // Wait for Stripe iframe to load
  cy.get('iframe[name^="__privateStripeFrame"]', { timeout: 10000 }).should('exist')
  
  // Note: Filling Stripe iframe requires special handling in real tests
  // For now, we'll simulate the form being filled
  cy.get('[data-testid="payment-form"]').should('exist')
  
  // In a real implementation, you'd use cy.iframe() or similar to interact with Stripe
  // For testing purposes, we'll assume payment form is filled correctly
})
*/

// Custom command to verify booking confirmation
Cypress.Commands.add('verifyBookingConfirmation', (confirmationNumber) => {
  cy.contains('Booking Confirmed').should('be.visible')
  cy.contains(confirmationNumber).should('be.visible')
  cy.contains('Thank you for your booking').should('be.visible')
})

// Custom command to select room and proceed to booking
Cypress.Commands.add('selectRoomAndProceed', (roomIndex = 0) => {
  cy.get('[data-testid="room-card"]').eq(roomIndex).within(() => {
    // Optionally adjust quantity
    // cy.contains('+').click() // Add more rooms if needed
    
    // Click Reserve button
    cy.contains('Reserve').click()
  })
})
