const ComprehensiveFuzzer = require('./index');
const { config } = require('./utils');

class LongTermFuzzer {
  constructor() {
    this.fuzzer = new ComprehensiveFuzzer();
    this.cycles = 0;
    this.totalDuration = 0;
    this.allResults = [];
    this.isRunning = false;
  }

  // Run fuzzing for 24 hours with breaks
  async run24Hours() {
    console.log('🚀 Starting 24-hour StayInn Robustness Testing');
    console.log('⏰ Target duration: 24 hours');
    console.log('🔄 Cycle duration: 30 minutes');
    console.log('⏸️  Break duration: 5 minutes\n');

    this.isRunning = true;
    const startTime = Date.now();
    const endTime = startTime + (24 * 60 * 60 * 1000); // 24 hours

    const cycleDuration = 30 * 60; // 30 minutes per cycle
    const breakDuration = 5 * 60 * 1000; // 5 minutes break in ms

    while (Date.now() < endTime && this.isRunning) {
      this.cycles++;
      const cycleStart = Date.now();
      
      console.log(`\n🔄 Cycle ${this.cycles} - ${new Date().toLocaleTimeString()}`);
      
      try {
        // Run one fuzzing cycle
        const results = await this.fuzzer.runAll(cycleDuration);
        results.cycle = this.cycles;
        results.cycleStartTime = new Date(cycleStart).toISOString();
        
        this.allResults.push(results);
        this.totalDuration += results.duration;
        
        // Display cycle summary
        console.log(`✅ Cycle ${this.cycles} completed in ${results.duration.toFixed(2)}s`);
        console.log(`   API Requests: ${results.overallStats.totalApiRequests}`);
        console.log(`   Form Tests: ${results.overallStats.totalFormTests}`);
        console.log(`   Errors: ${results.overallStats.totalErrors}`);
        
        // Save cumulative results
        await this.saveCumulativeResults();
        
        // Take a break if not the last cycle
        const remainingTime = endTime - Date.now();
        if (remainingTime > breakDuration && this.isRunning) {
          console.log(`⏸️  Taking a 5-minute break...`);
          await this.sleep(breakDuration);
        }
        
      } catch (error) {
        console.error(`❌ Cycle ${this.cycles} failed:`, error.message);
        // Continue with next cycle after a longer break
        if (this.isRunning) {
          await this.sleep(breakDuration * 2);
        }
      }
    }

    if (this.isRunning) {
      console.log('\n🏁 24-hour fuzzing marathon completed!');
      await this.generateFinalReport();
    } else {
      console.log('\n🛑 Fuzzing stopped by user');
    }
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Save cumulative results
  async saveCumulativeResults() {
    const fs = require('fs-extra');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, 'reports');
    await fs.ensureDir(reportsDir);
    
    const summary = {
      totalCycles: this.cycles,
      totalDuration: this.totalDuration,
      totalApiRequests: this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalApiRequests || 0), 0),
      totalFormTests: this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalFormTests || 0), 0),
      totalErrors: this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalErrors || 0), 0),
      totalSecurityIssues: this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalSecurityIssues || 0), 0),
      allCriticalFindings: this.allResults.flatMap(r => r.overallStats?.criticalFindings || []),
      startTime: this.allResults[0]?.startTime,
      lastUpdate: new Date().toISOString()
    };

    const cumulativeData = {
      summary,
      cycles: this.allResults
    };

    await fs.writeJson(path.join(reportsDir, 'long-term-fuzzing.json'), cumulativeData, { spaces: 2 });
  }

  // Generate comprehensive final report
  async generateFinalReport() {
    const fs = require('fs-extra');
    const path = require('path');
    
    console.log('\n📊 Generating final report...');
    
    // Calculate comprehensive statistics
    const stats = this.calculateFinalStats();
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(stats);
    
    const reportsDir = path.join(__dirname, 'reports');
    await fs.ensureDir(reportsDir);
    
    // Save HTML report
    await fs.writeFile(path.join(reportsDir, '24h-fuzzing-report.html'), htmlReport);
    
    // Save detailed JSON
    const detailedReport = {
      metadata: {
        totalCycles: this.cycles,
        totalDuration: this.totalDuration,
        startTime: this.allResults[0]?.startTime,
        endTime: new Date().toISOString(),
        target: config.TARGET_URL
      },
      statistics: stats,
      findings: this.allResults.flatMap(r => r.overallStats?.criticalFindings || []),
      allCycles: this.allResults
    };
    
    await fs.writeJson(path.join(reportsDir, '24h-fuzzing-detailed.json'), detailedReport, { spaces: 2 });
    
    // Display final summary
    this.displayFinalSummary(stats);
  }

  // Calculate final statistics
  calculateFinalStats() {
    const totalApiRequests = this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalApiRequests || 0), 0);
    const totalFormTests = this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalFormTests || 0), 0);
    const totalErrors = this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalErrors || 0), 0);
    const totalSecurityIssues = this.allResults.reduce((sum, r) => sum + (r.overallStats?.totalSecurityIssues || 0), 0);

    // Response time analysis
    const allApiResults = this.allResults.flatMap(r => r.apiResults?.results || []);
    const responseTimes = allApiResults.filter(r => r.responseTime).map(r => r.responseTime);
    
    // Error rate analysis over time
    const errorRates = this.allResults.map(r => ({
      cycle: r.cycle,
      errorRate: r.apiResults?.stats?.errorRate || 0
    }));

    return {
      totals: {
        cycles: this.cycles,
        duration: this.totalDuration,
        apiRequests: totalApiRequests,
        formTests: totalFormTests,
        errors: totalErrors,
        securityIssues: totalSecurityIssues
      },
      rates: {
        errorRate: totalApiRequests > 0 ? (totalErrors / totalApiRequests * 100).toFixed(2) : 0,
        securityIssueRate: totalFormTests > 0 ? (totalSecurityIssues / totalFormTests * 100).toFixed(2) : 0
      },
      performance: {
        avgResponseTime: responseTimes.length > 0 ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) : 0,
        maxResponseTime: Math.max(...responseTimes, 0),
        minResponseTime: Math.min(...responseTimes, Infinity) || 0
      },
      trends: {
        errorRates
      }
    };
  }

  // Generate HTML report
  generateHTMLReport(stats) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StayInn 24-Hour Fuzzing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        .findings { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .critical { color: #e74c3c; }
        .high { color: #f39c12; }
        .medium { color: #f1c40f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏨 StayInn 24-Hour Robustness Testing Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Target: ${config.TARGET_URL}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${stats.totals.cycles}</div>
            <div class="stat-label">Fuzzing Cycles</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${(stats.totals.duration / 3600).toFixed(1)}h</div>
            <div class="stat-label">Total Duration</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totals.apiRequests.toLocaleString()}</div>
            <div class="stat-label">API Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totals.formTests.toLocaleString()}</div>
            <div class="stat-label">Form Tests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totals.errors}</div>
            <div class="stat-label">Errors</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totals.securityIssues}</div>
            <div class="stat-label">Security Issues</div>
        </div>
    </div>

    <div class="findings">
        <h2>📊 Key Metrics</h2>
        <ul>
            <li><strong>Error Rate:</strong> ${stats.rates.errorRate}%</li>
            <li><strong>Security Issue Rate:</strong> ${stats.rates.securityIssueRate}%</li>
            <li><strong>Average Response Time:</strong> ${stats.performance.avgResponseTime}ms</li>
            <li><strong>Max Response Time:</strong> ${stats.performance.maxResponseTime}ms</li>
        </ul>

        <h2>🔍 Critical Findings</h2>
        ${this.allResults.flatMap(r => r.overallStats?.criticalFindings || []).length > 0 
          ? this.allResults.flatMap(r => r.overallStats?.criticalFindings || [])
              .map(f => `<div class="${f.severity.toLowerCase()}">
                <strong>${f.type}:</strong> ${f.count} occurrences (${f.severity})<br>
                <em>${f.description}</em>
              </div>`).join('<br>')
          : '<p>✅ No critical findings detected</p>'
        }

        <h2>📈 Performance Analysis</h2>
        <p>The application was tested continuously for ${(stats.totals.duration / 3600).toFixed(1)} hours across ${stats.totals.cycles} cycles.</p>
        <p>Total requests sent: ${(stats.totals.apiRequests + stats.totals.formTests).toLocaleString()}</p>
        
        <h2>🏁 Conclusion</h2>
        <p>The StayInn application has undergone comprehensive robustness testing. Review the detailed findings above and address any critical security issues identified.</p>
    </div>
</body>
</html>`;
  }

  // Display final summary
  displayFinalSummary(stats) {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 24-HOUR FUZZING MARATHON COMPLETE');
    console.log('='.repeat(80));
    console.log(`⏰ Total Duration: ${(stats.totals.duration / 3600).toFixed(1)} hours`);
    console.log(`🔄 Cycles Completed: ${stats.totals.cycles}`);
    console.log(`🌐 API Requests: ${stats.totals.apiRequests.toLocaleString()}`);
    console.log(`📝 Form Tests: ${stats.totals.formTests.toLocaleString()}`);
    console.log(`⚠️  Total Errors: ${stats.totals.errors}`);
    console.log(`🔒 Security Issues: ${stats.totals.securityIssues}`);
    console.log(`📊 Error Rate: ${stats.rates.errorRate}%`);
    console.log(`⚡ Avg Response: ${stats.performance.avgResponseTime}ms`);
    console.log('\n📁 Reports generated:');
    console.log('   • ./reports/24h-fuzzing-report.html');
    console.log('   • ./reports/24h-fuzzing-detailed.json');
    console.log('   • ./reports/long-term-fuzzing.json');
    console.log('='.repeat(80));
  }

  // Stop long-term fuzzing
  stop() {
    this.isRunning = false;
    this.fuzzer.stop();
    console.log('🛑 Long-term fuzzing stopped');
  }
}

// Run directly if called as script
if (require.main === module) {
  const longTermFuzzer = new LongTermFuzzer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping 24-hour fuzzer...');
    longTermFuzzer.stop();
  });
  
  longTermFuzzer.run24Hours().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('🔥 24-hour fuzzing failed:', error.message);
    process.exit(1);
  });
}
