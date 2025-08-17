# StayInn Robustness Testing Fuzzer

A comprehensive fuzzing framework for testing the robustness of the StayInn hotel booking application.

## Overview

This fuzzer targets critical components of the StayInn application:

### Primary Fuzzing Targets:
1. **API Endpoints** - Hotel search, booking, payment processing
2. **Form Validation** - Guest details, billing address, search forms  
3. **Search Functionality** - Destination autocomplete, date validation
4. **Data Processing** - Price calculations, room availability

## Quick Start

### Installation
```bash
cd fuzzing
npm install
```

### Basic Usage
```bash
# Run all fuzzers for 5 minutes
npm run fuzz

# Run 24-hour continuous fuzzing
npm run fuzz-24h

# Run specific fuzzers
npm run api-fuzz
npm run form-fuzz

# Generate test report
npm run report
```

## Fuzzing Strategies

### 1. API Endpoint Fuzzing
- **Target**: `/api/hotels`, `/api/hotels/prices`, `/api/bookings`, `/api/create-payment-intent`
- **Techniques**: 
  - Invalid parameter injection
  - SQL injection attempts
  - Malformed JSON payloads
  - Boundary value testing
  - Rate limiting tests

### 2. Form Validation Fuzzing
- **Target**: Guest details, billing address, search forms
- **Techniques**:
  - XSS payload injection
  - Buffer overflow attempts
  - Invalid email/phone formats
  - Unicode and special characters
  - Empty/null value testing

### 3. Search Function Fuzzing
- **Target**: Destination search, date selection
- **Techniques**:
  - Invalid destination IDs
  - Past dates and future limits
  - Malformed query strings
  - Special character injection

## Configuration

### Environment Setup
```bash
# Set target server (default: http://localhost:8080)
export FUZZ_TARGET_URL="http://localhost:8080"

# Set fuzzing duration (default: 300 seconds)
export FUZZ_DURATION=1800

# Set concurrent threads (default: 5)
export FUZZ_THREADS=10
```

### Fuzzing Intensity
- **Light**: 1-2 threads, 5 minutes
- **Medium**: 5-10 threads, 30 minutes  
- **Heavy**: 10-20 threads, 2+ hours
- **Marathon**: 5-10 threads, 24 hours

## Output and Reporting

### Log Files
- `logs/fuzzing.log` - Main fuzzing activity log
- `logs/errors.log` - Error responses and crashes
- `logs/security.log` - Potential security issues
- `reports/` - HTML and JSON test reports

### Report Contents
- Total requests sent
- Response status distribution
- Error rate analysis
- Performance metrics
- Security vulnerability findings
- Crash/hang detection

## Integration with CI/CD

The fuzzer can be integrated into your CI/CD pipeline:

```yaml
# .github/workflows/fuzzing.yml
name: Robustness Testing
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  fuzz-testing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Start application
        run: |
          cd server && npm install && npm start &
          cd client && npm install && npm run dev &
          sleep 30
      - name: Run fuzzing tests
        run: |
          cd fuzzing
          npm install
          npm run fuzz
      - name: Generate report
        run: npm run report
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: fuzzing-results
          path: fuzzing/reports/
```

## Advanced Features

### Custom Payloads
Add custom fuzzing payloads in `payloads/`:
- `xss-payloads.json` - XSS attack vectors
- `sql-injection.json` - SQL injection attempts
- `buffer-overflow.json` - Buffer overflow strings

### Integration Tests
The fuzzer can work alongside your existing test suites:
- Jest/Vitest unit tests
- Cypress E2E tests
- Custom integration tests

## Safety Considerations

⚠️ **Important**: Only run this fuzzer against:
- Local development environments
- Dedicated testing environments
- With explicit permission

**Never run against production systems without authorization.**

## Troubleshooting

### Common Issues
1. **Connection refused**: Ensure target server is running
2. **High error rates**: Check server capacity and reduce thread count
3. **Memory issues**: Lower concurrent threads and add delays

### Performance Tuning
- Adjust `FUZZ_THREADS` based on server capacity
- Use `FUZZ_DELAY` to add delays between requests
- Monitor server resources during fuzzing

## Contributing

1. Add new fuzzing strategies in `strategies/`
2. Extend payload collections in `payloads/`
3. Improve reporting in `reporting/`
4. Add integration tests

## License

MIT License - See LICENSE file for details.
