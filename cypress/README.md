# Cypress End-to-End System Testing for StayInn

This directory contains end-to-end tests for the StayInn hotel booking application using Cypress.

## Running Tests

### Setup
Ensure both frontend and backend servers are running:

```bash
# Frontend (port 5174)
cd client
npm run dev

# Backend (port 8080)
cd server
npm start
```

### Run Tests

**Interactive mode (recommended for development):**
```bash
npm run cypress:open
```

**Headless mode (for CI/CD):**
```bash
npm run test:e2e:headless
```

## Test Coverage

The test suite covers the following areas:

### Homepage and Navigation
- Hero section loading and form validation
- Date and guest/room constraint validation
- Search form functionality

### Hotel Search and Results
- Hotel search flow with API integration
- Results page display and compact search form
- Hotel card interactions

### Filtering and Sorting
- Price range filtering (multi-select checkboxes)
- Star rating filtering (single-select radio buttons)
- Guest rating filtering (single-select radio buttons)
- Sort functionality and filter combinations

### Room Selection
- Hotel detail navigation
- Room selection and quantity adjustment
- Price calculation

### Error Handling
- API failure scenarios
- Empty search results
- Network timeout handling

### Responsive Design
- Mobile and tablet viewport testing
- UI element responsiveness

### Performance
- Page load time validation
- Lazy loading verification

Note: Booking flow and payment tests have been removed as the booking page functionality is not yet implemented.

## Configuration
Tests are configured to run against:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Test data: Singapore hotels with mock API responses
