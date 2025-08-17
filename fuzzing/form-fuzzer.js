const { createLogger, config, utils } = require('./utils');

class FormFuzzer {
  constructor() {
    this.logger = createLogger('form-fuzzing.log');
    this.results = [];
    this.isRunning = false;
  }

  // Generate form validation test cases
  generateFormTestCases() {
    return {
      // Guest Details Form Tests
      guestDetails: {
        firstName: [
          '', // Empty
          ' ', // Whitespace only
          'A'.repeat(1000), // Very long
          '<script>alert("xss")</script>', // XSS
          '123456', // Numbers only
          'José María', // Unicode
          null, // Null
          undefined, // Undefined
          '\x00\x01\x02', // Control characters
          'O\'Reilly' // Apostrophe
        ],
        lastName: [
          '',
          'Smith-Jones',
          'van der Berg',
          '李小明',
          'Müller',
          '\'DROP TABLE users--',
          'A'.repeat(500)
        ],
        emailAddress: [
          '', // Empty
          'invalid-email', // Invalid format
          'test@', // Incomplete
          '@domain.com', // Missing local part
          'test@domain', // Missing TLD
          'test@domain..com', // Double dot
          'test@' + 'a'.repeat(1000) + '.com', // Very long domain
          '<script>@domain.com', // XSS attempt
          'test+tag@domain.com', // Plus addressing
          'test@domain.c', // Short TLD
          'test@[127.0.0.1]', // IP address
          'test@domain.toolongdomainextension'
        ],
        phoneNumber: [
          '', // Empty
          '+1234567890', // Valid international
          '123', // Too short
          '1'.repeat(50), // Too long
          'abc123', // Letters and numbers
          '+1 (555) 123-4567', // Formatted
          '001234567890', // International prefix
          '<script>alert("xss")</script>', // XSS
          '+1234567890' + 'x'.repeat(100) // Extension
        ],
        salutation: [
          '',
          'Mr.',
          'Ms.',
          'Dr.',
          'Prof.',
          '<script>',
          'A'.repeat(100),
          null,
          'Invalid Option'
        ]
      },

      // Billing Address Form Tests
      billingAddress: {
        country: [
          '', // Empty
          'SG', // Valid
          'US', // Valid
          'XX', // Invalid code
          'Singapore', // Full name instead of code
          '123', // Numbers
          '<script>', // XSS
          'A'.repeat(100) // Too long
        ],
        stateProvince: [
          '',
          'California',
          'CA',
          '123',
          'A'.repeat(1000),
          'São Paulo',
          '<script>alert("xss")</script>'
        ],
        postalCode: [
          '', // Empty
          '12345', // US format
          '12345-6789', // US+4 format
          'SW1A 1AA', // UK format
          '123456', // Singapore format
          'abc123', // Mixed
          '1'.repeat(20), // Too long
          '-123', // Negative
          '<script>', // XSS
          '000000' // All zeros
        ]
      },

      // Search Form Tests
      search: {
        destination: [
          '', // Empty
          'Singapore', // Valid
          'NonExistentCity', // Invalid
          'A'.repeat(1000), // Very long
          '<script>alert("xss")</script>', // XSS
          '\'DROP TABLE destinations--', // SQL injection
          '123456', // Numbers only
          '🏨🏠🏢', // Emojis
          '\x00\x01\x02', // Control chars
          'Paris, France', // With comma
        ],
        dates: [
          '', // Empty
          '2023-01-01', // Past date
          '2030-12-31', // Far future
          '2025-13-01', // Invalid month
          '2025-01-32', // Invalid day
          'invalid-date', // Invalid format
          '2025/01/01', // Wrong separator
          '01-01-2025', // Wrong order
          '2025-1-1', // No zero padding
          '2025-01-01T00:00:00Z' // With time
        ],
        guests: [
          '', // Empty
          '0', // Zero guests
          '1', // Valid
          '10', // Max
          '100', // Over limit
          '-1', // Negative
          'abc', // Non-numeric
          '1.5', // Decimal
          '∞', // Infinity symbol
          '1|2|3' // Pipe separated
        ]
      }
    };
  }

  // Validate form field with different inputs
  validateField(fieldName, fieldType, testValues) {
    const results = [];
    
    for (const value of testValues) {
      const testCase = {
        timestamp: new Date().toISOString(),
        fieldName,
        fieldType,
        inputValue: value,
        inputType: typeof value,
        inputLength: value ? value.toString().length : 0,
        validationResult: this.performValidation(fieldType, value),
        securityFlags: this.checkSecurityFlags(value)
      };
      
      results.push(testCase);
      this.results.push(testCase);
      
      // Log potential security issues
      if (testCase.securityFlags.length > 0) {
        this.logger.warn('Security flags detected', testCase);
      }
    }
    
    return results;
  }

  // Perform field validation (simulating frontend validation)
  performValidation(fieldType, value) {
    const result = {
      isEmpty: !value || value.toString().trim() === '',
      isValid: false,
      errors: []
    };

    try {
      switch (fieldType) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          result.isValid = emailRegex.test(value);
          if (!result.isValid && !result.isEmpty) {
            result.errors.push('Invalid email format');
          }
          break;

        case 'phone':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          const cleanPhone = value ? value.replace(/[\s\-\(\)]/g, '') : '';
          result.isValid = phoneRegex.test(cleanPhone);
          if (!result.isValid && !result.isEmpty) {
            result.errors.push('Invalid phone format');
          }
          break;

        case 'date':
          const dateObj = new Date(value);
          result.isValid = !isNaN(dateObj.getTime()) && value && value.match(/^\d{4}-\d{2}-\d{2}$/);
          if (!result.isValid && !result.isEmpty) {
            result.errors.push('Invalid date format');
          }
          break;

        case 'text':
          result.isValid = value && value.toString().trim().length > 0 && value.toString().length <= 100;
          if (!result.isValid && !result.isEmpty) {
            if (value.toString().length > 100) {
              result.errors.push('Text too long');
            } else {
              result.errors.push('Invalid text');
            }
          }
          break;

        case 'number':
          const numValue = parseInt(value);
          result.isValid = !isNaN(numValue) && numValue > 0 && numValue <= 10;
          if (!result.isValid && !result.isEmpty) {
            result.errors.push('Invalid number');
          }
          break;

        default:
          result.isValid = true;
      }
    } catch (error) {
      result.errors.push('Validation error: ' + error.message);
    }

    return result;
  }

  // Check for security-related patterns
  checkSecurityFlags(value) {
    const flags = [];
    
    if (!value) return flags;
    
    const strValue = value.toString().toLowerCase();
    
    // XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i
    ];
    
    if (xssPatterns.some(pattern => pattern.test(strValue))) {
      flags.push('XSS');
    }
    
    // SQL Injection patterns
    const sqlPatterns = [
      /'\s*(or|and)\s+/i,
      /'\s*;\s*drop/i,
      /'\s*;\s*delete/i,
      /'\s*;\s*update/i,
      /'\s*;\s*insert/i,
      /union\s+select/i,
      /--/,
      /\/\*/
    ];
    
    if (sqlPatterns.some(pattern => pattern.test(strValue))) {
      flags.push('SQL_INJECTION');
    }
    
    // Command Injection
    const commandPatterns = [
      /;\s*cat\s+/i,
      /;\s*ls\s+/i,
      /;\s*rm\s+/i,
      /;\s*curl\s+/i,
      /;\s*wget\s+/i,
      /\|\s*bash/i,
      /`.*`/,
      /\$\(.*\)/
    ];
    
    if (commandPatterns.some(pattern => pattern.test(strValue))) {
      flags.push('COMMAND_INJECTION');
    }
    
    // Directory Traversal
    if (strValue.includes('../') || strValue.includes('..\\')) {
      flags.push('DIRECTORY_TRAVERSAL');
    }
    
    // Buffer Overflow (very long strings)
    if (strValue.length > 10000) {
      flags.push('BUFFER_OVERFLOW');
    }
    
    // Null bytes
    if (strValue.includes('\x00')) {
      flags.push('NULL_BYTE');
    }
    
    return flags;
  }

  // Run comprehensive form fuzzing
  async run(duration = config.DURATION) {
    this.isRunning = true;
    this.logger.info(`Starting form fuzzing for ${duration} seconds`);
    
    const testCases = this.generateFormTestCases();
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    while (Date.now() < endTime && this.isRunning) {
      // Test guest details fields
      for (const [fieldName, testValues] of Object.entries(testCases.guestDetails)) {
        if (!this.isRunning) break;
        
        const fieldType = fieldName === 'emailAddress' ? 'email' : 
                         fieldName === 'phoneNumber' ? 'phone' : 'text';
        
        this.validateField(fieldName, fieldType, testValues);
        await utils.sleep(config.DELAY / 10); // Faster for form tests
      }
      
      // Test billing address fields
      for (const [fieldName, testValues] of Object.entries(testCases.billingAddress)) {
        if (!this.isRunning) break;
        
        this.validateField(fieldName, 'text', testValues);
        await utils.sleep(config.DELAY / 10);
      }
      
      // Test search form fields
      for (const [fieldName, testValues] of Object.entries(testCases.search)) {
        if (!this.isRunning) break;
        
        const fieldType = fieldName === 'dates' ? 'date' : 
                         fieldName === 'guests' ? 'number' : 'text';
        
        this.validateField(fieldName, fieldType, testValues);
        await utils.sleep(config.DELAY / 10);
      }
    }
    
    this.isRunning = false;
    this.logger.info('Form fuzzing completed');
    
    return this.getResults();
  }

  // Stop fuzzing
  stop() {
    this.isRunning = false;
    this.logger.info('Form fuzzing stopped');
  }

  // Get fuzzing results with analysis
  getResults() {
    const totalTests = this.results.length;
    const securityIssues = this.results.filter(r => r.securityFlags.length > 0);
    const validationFailures = this.results.filter(r => !r.validationResult.isValid && !r.validationResult.isEmpty);
    
    // Group by security flag types
    const securityFlagCounts = {};
    securityIssues.forEach(issue => {
      issue.securityFlags.forEach(flag => {
        securityFlagCounts[flag] = (securityFlagCounts[flag] || 0) + 1;
      });
    });
    
    // Group by field types
    const fieldResults = {};
    this.results.forEach(result => {
      if (!fieldResults[result.fieldName]) {
        fieldResults[result.fieldName] = {
          total: 0,
          securityIssues: 0,
          validationFailures: 0
        };
      }
      fieldResults[result.fieldName].total++;
      if (result.securityFlags.length > 0) {
        fieldResults[result.fieldName].securityIssues++;
      }
      if (!result.validationResult.isValid && !result.validationResult.isEmpty) {
        fieldResults[result.fieldName].validationFailures++;
      }
    });
    
    return {
      type: 'Form Validation Fuzzing',
      duration: config.DURATION,
      results: this.results,
      summary: {
        totalTests,
        securityIssues: securityIssues.length,
        validationFailures: validationFailures.length,
        securityIssueRate: `${(securityIssues.length / totalTests * 100).toFixed(2)}%`,
        securityFlagCounts,
        fieldResults
      }
    };
  }
}

module.exports = FormFuzzer;

// Run directly if called as script
if (require.main === module) {
  const fuzzer = new FormFuzzer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nStopping form fuzzer...');
    fuzzer.stop();
  });
  
  fuzzer.run().then(results => {
    console.log('\n=== Form Fuzzing Results ===');
    console.log(JSON.stringify(results.summary, null, 2));
    process.exit(0);
  }).catch(error => {
    console.error('Form fuzzing failed:', error);
    process.exit(1);
  });
}
