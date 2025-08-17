const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, 'reports');
  }

  async generateReport() {
    try {
      console.log('📊 Generating comprehensive fuzzing report...');
      
      // Ensure reports directory exists
      await fs.ensureDir(this.reportsDir);
      
      // Find the latest report files
      const longTermReport = path.join(this.reportsDir, 'long-term-fuzzing.json');
      const detailedReport = path.join(this.reportsDir, '24h-fuzzing-detailed.json');
      
      let reportData = null;
      
      // Try to load existing reports
      if (await fs.pathExists(longTermReport)) {
        reportData = await fs.readJson(longTermReport);
        console.log('📁 Found long-term fuzzing report');
      } else if (await fs.pathExists(detailedReport)) {
        reportData = await fs.readJson(detailedReport);
        console.log('📁 Found detailed fuzzing report');
      } else {
        console.log('❌ No fuzzing reports found. Run fuzzing tests first!');
        console.log('💡 Try: npm run fuzz or npm run fuzz-24h');
        return;
      }
      
      // Generate HTML summary report
      const htmlReport = this.generateHTMLSummary(reportData);
      const htmlPath = path.join(this.reportsDir, 'fuzzing-summary.html');
      await fs.writeFile(htmlPath, htmlReport);
      
      // Generate console summary
      this.displayConsoleSummary(reportData);
      
      console.log('\n✅ Report generation complete!');
      console.log(`📁 HTML Report: ${htmlPath}`);
      console.log(`🌐 Open in browser: file://${htmlPath.replace(/\\/g, '/')}`);
      
    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
    }
  }

  generateHTMLSummary(reportData) {
    const summary = reportData.summary || reportData.metadata || {};
    const stats = reportData.statistics || this.calculateBasicStats(reportData);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StayInn Fuzzing Report Summary</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); 
            color: white; 
            padding: 40px; 
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 0; 
        }
        .stat-card { 
            padding: 30px; 
            text-align: center; 
            border-right: 1px solid #ecf0f1;
            border-bottom: 1px solid #ecf0f1;
        }
        .stat-card:last-child { border-right: none; }
        .stat-number { 
            font-size: 2.5em; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .stat-label { 
            color: #7f8c8d; 
            font-size: 0.9em; 
            text-transform: uppercase; 
            letter-spacing: 1px;
        }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section h2 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px; 
        }
        .findings { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #3498db;
        }
        .critical { color: #e74c3c; font-weight: bold; }
        .high { color: #f39c12; font-weight: bold; }
        .medium { color: #f1c40f; font-weight: bold; }
        .low { color: #27ae60; }
        .footer {
            background: #ecf0f1;
            padding: 20px;
            text-align: center;
            color: #7f8c8d;
        }
        .highlight { background: #e8f6ff; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏨 StayInn Fuzzing Report</h1>
            <p>Robustness & Security Testing Summary</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" style="color: #3498db;">${summary.totalCycles || stats?.totals?.cycles || 'N/A'}</div>
                <div class="stat-label">Cycles</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #2ecc71;">${summary.totalApiRequests || stats?.totals?.apiRequests || 'N/A'}</div>
                <div class="stat-label">API Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #f39c12;">${summary.totalFormTests || stats?.totals?.formTests || 'N/A'}</div>
                <div class="stat-label">Form Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #e74c3c;">${summary.totalErrors || stats?.totals?.errors || 'N/A'}</div>
                <div class="stat-label">Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #9b59b6;">${summary.totalSecurityIssues || stats?.totals?.securityIssues || 'N/A'}</div>
                <div class="stat-label">Security Issues</div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>📊 Test Summary</h2>
                <div class="highlight">
                    <strong>Duration:</strong> ${this.formatDuration(summary.totalDuration)} |
                    <strong>Start:</strong> ${summary.startTime ? new Date(summary.startTime).toLocaleString() : 'Unknown'} |
                    <strong>Last Update:</strong> ${summary.lastUpdate ? new Date(summary.lastUpdate).toLocaleString() : 'Unknown'}
                </div>
            </div>

            <div class="section">
                <h2>🔍 Key Findings</h2>
                <div class="findings">
                    ${this.generateFindingsHTML(summary.allCriticalFindings || [])}
                </div>
            </div>

            <div class="section">
                <h2>📈 Performance Metrics</h2>
                <ul>
                    <li><strong>Error Rate:</strong> ${stats?.rates?.errorRate || 'Unknown'}%</li>
                    <li><strong>Security Issue Rate:</strong> ${stats?.rates?.securityIssueRate || 'Unknown'}%</li>
                    <li><strong>Average Response Time:</strong> ${stats?.performance?.avgResponseTime || 'Unknown'}ms</li>
                    <li><strong>Max Response Time:</strong> ${stats?.performance?.maxResponseTime || 'Unknown'}ms</li>
                </ul>
            </div>

            <div class="section">
                <h2>🎯 Recommendations</h2>
                <div class="findings">
                    ${this.generateRecommendations(summary)}
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated by StayInn Fuzzing Framework v1.0.0</p>
            <p>For detailed analysis, check the JSON reports in the reports directory</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateFindingsHTML(findings) {
    if (!findings || findings.length === 0) {
      return '<p style="color: #27ae60;">✅ No critical security issues found during testing</p>';
    }

    return findings.map(finding => `
      <div class="${finding.severity?.toLowerCase() || 'medium'}" style="margin-bottom: 10px;">
        <strong>${finding.type || 'Unknown'}:</strong> 
        ${finding.count || 0} occurrences (${finding.severity || 'Unknown'})
        <br><em>${finding.description || 'No description available'}</em>
      </div>
    `).join('');
  }

  generateRecommendations(summary) {
    const recommendations = [];
    
    if (summary.totalErrors > 0) {
      recommendations.push('🔧 Investigate and fix API errors to improve stability');
    }
    
    if (summary.totalSecurityIssues > 0) {
      recommendations.push('🔒 Address security vulnerabilities immediately');
    }
    
    if (summary.totalApiRequests > 10000) {
      recommendations.push('⚡ Consider implementing rate limiting for better performance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Application shows good robustness - continue regular testing');
    }

    return recommendations.map(rec => `<li>${rec}</li>`).join('');
  }

  formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  calculateBasicStats(reportData) {
    // Basic stats calculation if not available
    return {
      totals: {
        cycles: reportData.cycles?.length || 0,
        apiRequests: 0,
        formTests: 0,
        errors: 0,
        securityIssues: 0
      },
      rates: {
        errorRate: 0,
        securityIssueRate: 0
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0
      }
    };
  }

  displayConsoleSummary(reportData) {
    const summary = reportData.summary || reportData.metadata || {};
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FUZZING REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`🔄 Cycles: ${summary.totalCycles || 'Unknown'}`);
    console.log(`🌐 API Requests: ${summary.totalApiRequests || 'Unknown'}`);
    console.log(`📝 Form Tests: ${summary.totalFormTests || 'Unknown'}`);
    console.log(`⚠️  Errors: ${summary.totalErrors || 'Unknown'}`);
    console.log(`🔒 Security Issues: ${summary.totalSecurityIssues || 'Unknown'}`);
    console.log(`⏱️  Duration: ${this.formatDuration(summary.totalDuration)}`);
    console.log('='.repeat(60));
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ReportGenerator();
  generator.generateReport().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Report generation failed:', error.message);
    process.exit(1);
  });
}

module.exports = ReportGenerator;
