/**
 * Scan for memory leak issues (event listeners)
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
    
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    if (line.includes('removeListener') || line.includes('once')) return;
    
    if (line.includes(".on('finish'") || line.includes(".on('close'")) {
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
    
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('dist')) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Scanning for memory leak issues...\n');

scanDirectory('./src');

console.log(`Found ${issues.length} potential memory leaks\n`);

issues.forEach(issue => {
  const fileName = issue.file.split('/').pop();
  console.log(`${fileName}:${issue.line}`);
  console.log(`  ${issue.code}`);
  console.log('');
});

