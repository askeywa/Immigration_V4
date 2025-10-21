/**
 * Detailed MongoDB Injection Vulnerability Scanner
 * Identifies exact lines that need ValidationUtils
 */

const fs = require('fs');
const path = require('path');

const vulnerabilities = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    
    // Check for MongoDB injection patterns
    const patterns = [
      { regex: /\.findById\s*\(\s*req\.(params|body|query)\./, type: 'findById with req param' },
      { regex: /\.findOne\s*\(\s*\{\s*\w+:\s*req\.(params|body|query)\./, type: 'findOne with req param' },
      { regex: /\.find\s*\(\s*\{\s*\w+:\s*req\.(params|body|query)\./, type: 'find with req param' },
      { regex: /\.findById\s*\(\s*\w+\)(?!.*mongoose\.Types\.ObjectId\.isValid)/, type: 'findById without validation' },
      { regex: /\.findByIdAndUpdate\s*\(\s*req\.(params|body|query)\./, type: 'findByIdAndUpdate with req param' },
      { regex: /\.findByIdAndDelete\s*\(\s*req\.(params|body|query)\./, type: 'findByIdAndDelete with req param' }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.regex.test(line) && !line.includes('ValidationUtils')) {
        vulnerabilities.push({
          file: filePath,
          line: lineNum,
          code: trimmed,
          type: pattern.type,
          severity: line.includes('req.params') || line.includes('req.body') ? 'CRITICAL' : 'HIGH'
        });
      }
    });
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('dist') && !entry.name.includes('tests')) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Detailed MongoDB Injection Vulnerability Scan\n');
console.log('='.repeat(80));

scanDirectory('./src');

// Group by file
const byFile = {};
vulnerabilities.forEach(v => {
  const fileName = v.file.split(/[\\/]/).pop();
  if (!byFile[fileName]) {
    byFile[fileName] = [];
  }
  byFile[fileName].push(v);
});

// Sort by severity and count
const fileList = Object.entries(byFile)
  .map(([file, issues]) => ({
    file,
    count: issues.length,
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    issues: issues
  }))
  .sort((a, b) => b.critical - a.critical || b.count - a.count);

console.log(`\n📊 Found ${vulnerabilities.length} MongoDB injection vulnerabilities\n`);
console.log('Files ranked by severity:\n');

fileList.forEach((item, index) => {
  console.log(`${index + 1}. ${item.file} (${item.count} issues, ${item.critical} critical)`);
  item.issues.slice(0, 3).forEach(issue => {
    console.log(`   Line ${issue.line}: ${issue.type}`);
    console.log(`   ${issue.code.substring(0, 80)}${issue.code.length > 80 ? '...' : ''}`);
  });
  if (item.issues.length > 3) {
    console.log(`   ... and ${item.issues.length - 3} more issues`);
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n🎯 Priority Fix Order:`);
console.log(`\n1. CRITICAL files (with req.params/req.body):`);
fileList.filter(f => f.critical > 0).slice(0, 5).forEach((f, i) => {
  console.log(`   ${i + 1}. ${f.file} (${f.critical} critical issues)`);
});

console.log(`\n2. Total files needing fixes: ${fileList.length}`);
console.log(`3. Total vulnerabilities: ${vulnerabilities.length}`);

