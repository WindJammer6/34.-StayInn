const fs = require('fs-extra');
const winston = require('winston');
const path = require('path');

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = ['logs', 'reports', 'payloads', 'strategies'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// Configure logger
const createLogger = (logFile) => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: path.join(__dirname, 'logs', logFile) }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

// Configuration
const config = {
  TARGET_URL: process.env.FUZZ_TARGET_URL || 'http://localhost:8080',
  DURATION: parseInt(process.env.FUZZ_DURATION) || 300, // 5 minutes default
  THREADS: parseInt(process.env.FUZZ_THREADS) || 5,
  DELAY: parseInt(process.env.FUZZ_DELAY) || 100, // ms between requests
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Common utilities
const utils = {
  // Generate random string with various character sets
  randomString: (length = 10, charset = 'alphanum') => {
    const charsets = {
      alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numeric: '0123456789',
      alphanum: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      unicode: 'àáâãäåæçèéêëìíîïñòóôõöøùúûüý',
      xss: '<script>alert("xss")</script>',
      sql: "'; DROP TABLE users; --"
    };
    
    const chars = charsets[charset] || charsets.alphanum;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random number in range
  randomInt: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate random boolean
  randomBool: () => Math.random() < 0.5,

  // Generate random date
  randomDate: (startDate = new Date(2024, 0, 1), endDate = new Date(2026, 11, 31)) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return new Date(start + Math.random() * (end - start));
  },

  // Format date as YYYY-MM-DD
  formatDate: (date) => {
    return date.toISOString().split('T')[0];
  },

  // Sleep utility
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate fuzzing statistics
  generateStats: (results) => {
    const total = results.length;
    const statusCodes = {};
    const errorCount = results.filter(r => r.error).length;
    const responseTimesMs = results.filter(r => r.responseTime).map(r => r.responseTime);
    
    results.forEach(r => {
      if (r.statusCode) {
        statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
      }
    });

    const avgResponseTime = responseTimesMs.length > 0 
      ? responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length 
      : 0;

    return {
      total,
      errorCount,
      errorRate: (errorCount / total * 100).toFixed(2),
      statusCodes,
      avgResponseTime: avgResponseTime.toFixed(2),
      maxResponseTime: Math.max(...responseTimesMs, 0),
      minResponseTime: Math.min(...responseTimesMs, Infinity) || 0
    };
  }
};

module.exports = {
  ensureDirectories,
  createLogger,
  config,
  utils
};
