const axios = require('axios');
const { createLogger, config, utils } = require('./utils');

class APIFuzzer {
  constructor() {
    this.logger = createLogger('api-fuzzing.log');
    this.results = [];
    this.baseURL = config.TARGET_URL;
    this.isRunning = false;
  }

  // Generate malicious payloads for different attack vectors
  generatePayloads() {
    return {
      // XSS Payloads
      xss: [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ],

      // SQL Injection Payloads
      sql: [
        "' OR '1'='1",
        "'; DROP TABLE hotels; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 #",
        "'; UPDATE bookings SET price=0; --"
      ],

      // NoSQL Injection
      nosql: [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "return true"}',
        '{"$or": [{}]}'
      ],

      // Buffer Overflow / Long Strings
      overflow: [
        'A'.repeat(10000),
        'A'.repeat(100000),
        '\x00'.repeat(1000),
        utils.randomString(50000, 'alphanum')
      ],

      // Format String Attacks
      format: [
        '%n%n%n%n%n%n%n%n%n%n',
        '%x%x%x%x%x%x%x%x%x%x',
        '%s%s%s%s%s%s%s%s%s%s',
        '{{7*7}}',
        '${7*7}',
        '<%=7*7%>'
      ],

      // Unicode and Special Characters
      unicode: [
        '🏨🏠🏢🏬🏭🏯🏰',
        'ÄÖÜäöüß',
        '测试酒店',
        'فندق',
        'гостиница',
        '\\u0000\\u0001\\u0002'
      ],

      // Null and Empty Values
      null: [
        null,
        undefined,
        '',
        ' ',
        '\t\n\r',
        '0',
        'null',
        'undefined'
      ]
    };
  }

  // Generate fuzzed parameters for hotel endpoints
  generateFuzzedParams() {
    const payloads = this.generatePayloads();
    const allPayloads = Object.values(payloads).flat();
    
    return {
      // Valid base case
      valid: {
        destination_id: 'WD0M',
        checkin: utils.formatDate(new Date(2025, 11, 1)),
        checkout: utils.formatDate(new Date(2025, 11, 7)),
        lang: 'en_US',
        currency: 'SGD',
        country_code: 'SG',
        guests: '2'
      },

      // Fuzzed parameters
      fuzzed: {
        destination_id: utils.randomString(utils.randomInt(1, 100), 'alphanum'),
        checkin: allPayloads[Math.floor(Math.random() * allPayloads.length)],
        checkout: allPayloads[Math.floor(Math.random() * allPayloads.length)],
        lang: utils.randomString(utils.randomInt(1, 20), 'special'),
        currency: allPayloads[Math.floor(Math.random() * allPayloads.length)],
        country_code: utils.randomString(utils.randomInt(1, 10), 'unicode'),
        guests: allPayloads[Math.floor(Math.random() * allPayloads.length)]
      },

      // Edge cases
      edge: {
        destination_id: utils.randomInt(-1000, 1000).toString(),
        checkin: '1900-01-01',
        checkout: '3000-12-31', 
        lang: utils.randomString(1000, 'special'),
        currency: '',
        country_code: null,
        guests: utils.randomInt(-100, 1000).toString()
      }
    };
  }

  // Generate fuzzed booking data
  generateFuzzedBooking() {
    const payloads = this.generatePayloads();
    const allPayloads = Object.values(payloads).flat();
    
    return {
      firstName: allPayloads[Math.floor(Math.random() * allPayloads.length)],
      lastName: utils.randomString(utils.randomInt(0, 1000), 'unicode'),
      emailAddress: allPayloads[Math.floor(Math.random() * allPayloads.length)],
      phoneNumber: utils.randomString(utils.randomInt(0, 100), 'special'),
      salutation: allPayloads[Math.floor(Math.random() * allPayloads.length)],
      specialRequests: 'A'.repeat(utils.randomInt(0, 100000)),
      billingFirstName: payloads.xss[Math.floor(Math.random() * payloads.xss.length)],
      billingLastName: payloads.sql[Math.floor(Math.random() * payloads.sql.length)],
      country: utils.randomString(utils.randomInt(0, 50), 'special'),
      stateProvince: null,
      postalCode: utils.randomInt(-1000, 1000000).toString()
    };
  }

  // Fuzz a single endpoint
  async fuzzEndpoint(endpoint, method = 'GET', data = null, params = null) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status code
      };

      if (data) config.data = data;
      if (params) config.params = params;

      const response = await axios(config);
      const endTime = Date.now();

      const result = {
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        params,
        data,
        statusCode: response.status,
        responseTime: endTime - startTime,
        responseSize: JSON.stringify(response.data).length,
        error: null
      };

      this.results.push(result);
      
      // Log interesting responses
      if (response.status >= 500) {
        this.logger.error('Server error response', result);
      } else if (response.status === 200 && response.data) {
        // Check for potential data leakage
        const responseStr = JSON.stringify(response.data).toLowerCase();
        const sensitivePatterns = ['password', 'secret', 'key', 'token', 'admin'];
        const foundSensitive = sensitivePatterns.some(pattern => responseStr.includes(pattern));
        
        if (foundSensitive) {
          this.logger.warn('Potential sensitive data exposure', result);
        }
      }

      return result;

    } catch (error) {
      const endTime = Date.now();
      const result = {
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        params,
        data,
        error: error.message,
        responseTime: endTime - startTime
      };

      this.results.push(result);
      this.logger.error('Request failed', result);
      return result;
    }
  }

  // Fuzz all API endpoints
  async fuzzAllEndpoints() {
    this.logger.info('Starting API fuzzing...');
    
    const endpoints = [
      { path: '/api/hotels', method: 'GET' },
      { path: '/api/hotels/prices', method: 'GET' },
      { path: '/api/hotels/test123/price', method: 'GET' },
      { path: '/api/bookings', method: 'POST' },
      { path: '/api/create-payment-intent', method: 'POST' },
      { path: '/api/search-hotels', method: 'POST' },
      { path: '/api/bookingresults', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      if (!this.isRunning) break;

      // Test with valid parameters
      const validParams = this.generateFuzzedParams().valid;
      await this.fuzzEndpoint(endpoint.path, endpoint.method, null, validParams);
      await utils.sleep(config.DELAY);

      // Test with fuzzed parameters  
      for (let i = 0; i < 10; i++) {
        if (!this.isRunning) break;
        
        const fuzzedParams = this.generateFuzzedParams().fuzzed;
        await this.fuzzEndpoint(endpoint.path, endpoint.method, null, fuzzedParams);
        await utils.sleep(config.DELAY);
      }

      // Test POST endpoints with fuzzed body data
      if (endpoint.method === 'POST') {
        for (let i = 0; i < 5; i++) {
          if (!this.isRunning) break;
          
          let fuzzedData;
          if (endpoint.path.includes('booking')) {
            fuzzedData = this.generateFuzzedBooking();
          } else if (endpoint.path.includes('payment')) {
            fuzzedData = {
              currency: utils.randomString(utils.randomInt(1, 100), 'special'),
              amount: utils.randomString(utils.randomInt(1, 1000), 'unicode')
            };
          } else {
            fuzzedData = { destination: utils.randomString(utils.randomInt(0, 1000), 'special') };
          }
          
          await this.fuzzEndpoint(endpoint.path, endpoint.method, fuzzedData);
          await utils.sleep(config.DELAY);
        }
      }
    }
  }

  // Run fuzzing for specified duration
  async run(duration = config.DURATION) {
    this.isRunning = true;
    this.logger.info(`Starting API fuzzing for ${duration} seconds`);
    
    const endTime = Date.now() + (duration * 1000);
    
    while (Date.now() < endTime && this.isRunning) {
      await this.fuzzAllEndpoints();
    }
    
    this.isRunning = false;
    this.logger.info('API fuzzing completed');
    
    return this.getResults();
  }

  // Stop fuzzing
  stop() {
    this.isRunning = false;
    this.logger.info('API fuzzing stopped');
  }

  // Get fuzzing results
  getResults() {
    const stats = utils.generateStats(this.results);
    
    return {
      type: 'API Fuzzing',
      duration: config.DURATION,
      results: this.results,
      stats,
      summary: {
        totalRequests: stats.total,
        errorRate: `${stats.errorRate}%`,
        avgResponseTime: `${stats.avgResponseTime}ms`,
        statusCodes: stats.statusCodes
      }
    };
  }
}

module.exports = APIFuzzer;

// Run directly if called as script
if (require.main === module) {
  const fuzzer = new APIFuzzer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nStopping API fuzzer...');
    fuzzer.stop();
  });
  
  fuzzer.run().then(results => {
    console.log('\n=== API Fuzzing Results ===');
    console.log(JSON.stringify(results.summary, null, 2));
    process.exit(0);
  }).catch(error => {
    console.error('API fuzzing failed:', error);
    process.exit(1);
  });
}
