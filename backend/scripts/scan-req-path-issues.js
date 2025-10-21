/**
 * Scan for req.path vs req.originalUrl issues
 */

const fs = require('fs');
const path = require('path');

const issues = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments and already fixed lines
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    if (line.includes('req.originalUrl')) return;
    if (line.includes("req.path === '/health'")) return;
    if (line.includes('req.requestId')) return;
    
    // Find req.path usage
    if (line.includes('req.path') && !line.includes('req.user?.userId')) {
      issues.push({
        file: filePath.replace(/\\/g, '/'),
        line: lineNum,
        code: trimmed
      });
    }
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

console.log('🔍 Scanning for req.path issues...\n');

scanDirectory('./src');

console.log(`Found ${issues.length} instances of req.path\n`);

const byFile = {};
issues.forEach(issue => {
  const fileName = issue.file.split('/').pop();
  if (!byFile[fileName]) byFile[fileName] = [];
  byFile[fileName].push(issue);
});

Object.entries(byFile).forEach(([file, fileIssues]) => {
  console.log(`${file} (${fileIssues.length} issues):`);
  fileIssues.forEach(issue => {
    console.log(`  Line ${issue.line}: ${issue.code.substring(0, 80)}`);
  });
  console.log('');
});

