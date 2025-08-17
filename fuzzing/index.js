const { ensureDirectories, createLogger, config, utils } = require('./utils');
const APIFuzzer = require('./api-fuzzer');
const FormFuzzer = require('./form-fuzzer');

class ComprehensiveFuzzer {
  constructor() {
    ensureDirectories();
    this.logger = createLogger('comprehensive-fuzzing.log');
    this.apiFuzzer = new APIFuzzer();
    this.formFuzzer = new FormFuzzer();
    this.results = {
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      apiResults: null,
      formResults: null,
      overallStats: null
    };
  }

  // Run all fuzzing strategies
  async runAll(duration = config.DURATION) {
    this.logger.info(`Starting comprehensive fuzzing for ${duration} seconds`);
    console.log(`🚀 StayInn Robustness Testing Started`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`🎯 Target: ${config.TARGET_URL}`);
    console.log(`🧵 Threads: ${config.THREADS}`);
    console.log(`⏳ Delay: ${config.DELAY}ms\n`);

    const startTime = Date.now();
    
    try {
      // Run API fuzzing and form fuzzing in parallel for shorter duration each
      const halfDuration = Math.floor(duration / 2);
      
      console.log('🔍 Starting API endpoint fuzzing...');
      const apiPromise = this.apiFuzzer.run(halfDuration);
      
      console.log('📝 Starting form validation fuzzing...');
      const formPromise = this.formFuzzer.run(halfDuration);
      
      // Wait for both to complete
      const [apiResults, formResults] = await Promise.all([apiPromise, formPromise]);
      
      const endTime = Date.now();
      this.results.endTime = new Date().toISOString();
      this.results.duration = (endTime - startTime) / 1000;
      this.results.apiResults = apiResults;
      this.results.formResults = formResults;
      
      // Generate overall statistics
      this.results.overallStats = this.generateOverallStats();
      
      // Display summary
      this.displaySummary();
      
      // Save results to file
      await this.saveResults();
      
      return this.results;
      
    } catch (error) {
      this.logger.error('Comprehensive fuzzing failed', error);
      throw error;
    }
  }

  // Generate overall statistics
  generateOverallStats() {
    const apiStats = this.results.apiResults?.stats || {};
    const formStats = this.results.formResults?.summary || {};
    
    return {
      totalApiRequests: apiStats.total || 0,
      totalFormTests: formStats.totalTests || 0,
      totalSecurityIssues: (formStats.securityIssues || 0),
      totalErrors: (apiStats.errorCount || 0),
      avgApiResponseTime: apiStats.avgResponseTime || 0,
      criticalFindings: this.identifyCriticalFindings()
    };
  }

  // Identify critical security findings
  identifyCriticalFindings() {
    const findings = [];
    
    // Check API results for critical issues
    if (this.results.apiResults?.results) {
      const serverErrors = this.results.apiResults.results.filter(r => r.statusCode >= 500);
      if (serverErrors.length > 0) {
        findings.push({
          type: 'SERVER_ERRORS',
          count: serverErrors.length,
          severity: 'HIGH',
          description: 'Server errors detected during API fuzzing'
        });
      }
      
      // Check for potential data exposure
      const dataExposure = this.results.apiResults.results.filter(r => 
        r.statusCode === 200 && r.responseSize > 10000
      );
      if (dataExposure.length > 0) {
        findings.push({
          type: 'LARGE_RESPONSES',
          count: dataExposure.length,
          severity: 'MEDIUM',
          description: 'Unusually large API responses detected'
        });
      }
    }
    
    // Check form results for security issues
    if (this.results.formResults?.summary?.securityFlagCounts) {
      const flags = this.results.formResults.summary.securityFlagCounts;
      
      if (flags.XSS > 0) {
        findings.push({
          type: 'XSS_VULNERABILITY',
          count: flags.XSS,
          severity: 'HIGH',
          description: 'Potential XSS vulnerabilities in form validation'
        });
      }
      
      if (flags.SQL_INJECTION > 0) {
        findings.push({
          type: 'SQL_INJECTION',
          count: flags.SQL_INJECTION,
          severity: 'CRITICAL',
          description: 'Potential SQL injection vulnerabilities detected'
        });
      }
    }
    
    return findings;
  }

  // Display summary to console
  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 STAYINN FUZZING COMPLETED');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total Duration: ${this.results.duration.toFixed(2)} seconds`);
    console.log(`🌐 API Requests: ${this.results.overallStats.totalApiRequests}`);
    console.log(`📝 Form Tests: ${this.results.overallStats.totalFormTests}`);
    console.log(`⚠️  Errors: ${this.results.overallStats.totalErrors}`);
    console.log(`🔒 Security Issues: ${this.results.overallStats.totalSecurityIssues}`);
    
    if (this.results.apiResults?.summary) {
      console.log('\n📊 API FUZZING RESULTS:');
      console.log(`   • Error Rate: ${this.results.apiResults.summary.errorRate}`);
      console.log(`   • Avg Response: ${this.results.apiResults.summary.avgResponseTime}ms`);
      console.log(`   • Status Codes:`, this.results.apiResults.summary.statusCodes);
    }
    
    if (this.results.formResults?.summary) {
      console.log('\n📝 FORM FUZZING RESULTS:');
      console.log(`   • Security Issues: ${this.results.formResults.summary.securityIssues}`);
      console.log(`   • Validation Failures: ${this.results.formResults.summary.validationFailures}`);
      if (this.results.formResults.summary.securityFlagCounts) {
        console.log(`   • Security Flags:`, this.results.formResults.summary.securityFlagCounts);
      }
    }
    
    if (this.results.overallStats.criticalFindings.length > 0) {
      console.log('\n🚨 CRITICAL FINDINGS:');
      this.results.overallStats.criticalFindings.forEach(finding => {
        console.log(`   • ${finding.type}: ${finding.count} (${finding.severity})`);
        console.log(`     ${finding.description}`);
      });
    }
    
    console.log('\n📁 Results saved to: ./reports/fuzzing-report.json');
    console.log('📊 View detailed logs in: ./logs/');
    console.log('='.repeat(60));
  }

  // Save results to JSON file
  async saveResults() {
    const fs = require('fs-extra');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, 'reports');
    await fs.ensureDir(reportsDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fuzzing-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.writeJson(filepath, this.results, { spaces: 2 });
    
    // Also save as latest
    const latestPath = path.join(reportsDir, 'fuzzing-report.json');
    await fs.writeJson(latestPath, this.results, { spaces: 2 });
    
    this.logger.info(`Results saved to ${filepath}`);
  }

  // Stop all fuzzing
  stop() {
    this.apiFuzzer.stop();
    this.formFuzzer.stop();
    this.logger.info('All fuzzing stopped');
  }
}

module.exports = ComprehensiveFuzzer;

// Run directly if called as script
if (require.main === module) {
  const fuzzer = new ComprehensiveFuzzer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping fuzzer...');
    fuzzer.stop();
  });
  
  fuzzer.runAll().then(results => {
    process.exit(0);
  }).catch(error => {
    console.error('🔥 Fuzzing failed:', error.message);
    process.exit(1);
  });
}
