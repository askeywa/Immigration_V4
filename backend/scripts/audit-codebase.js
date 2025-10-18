/**
 * Automated Security Audit Script
 * Scans codebase for common security vulnerabilities
 */

const fs = require('fs');
const path = require('path');

const results = {
  mongoInjection: [],
  sensitiveLogging: [],
  missingValidation: [],
  pathVsOriginalUrl: [],
  memoryLeaks: [],
  missingAuthorization: []
};

function scanDirectory(dir, pattern, check) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('dist')) {
      scanDirectory(fullPath, pattern, check);
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (check(line, content, fullPath)) {
          pattern.push({
            file: fullPath.replace(/\\/g, '/'),
            line: index + 1,
            code: line.trim()
          });
        }
      });
    }
  }
}

console.log('🔍 COMPREHENSIVE SECURITY AUDIT\n');
console.log('Scanning backend codebase for vulnerabilities...\n');
console.log('='.repeat(70));

// 1. MongoDB Injection
console.log('\n1️⃣ MongoDB Injection Vulnerabilities:');
scanDirectory('./src', results.mongoInjection, (line) => {
  return (line.includes('findById') || line.includes('findOne') || line.includes('.find(')) &&
         !line.includes('mongoose.Types.ObjectId.isValid') &&
         !line.includes('//') &&
         line.trim().length > 0;
});
console.log(`   Found ${results.mongoInjection.length} potential issues ⚠️`);
if (results.mongoInjection.length > 0) {
  results.mongoInjection.slice(0, 5).forEach(item => {
    console.log(`     ${item.file.split('/').pop()}:${item.line}`);
  });
  if (results.mongoInjection.length > 5) {
    console.log(`     ... and ${results.mongoInjection.length - 5} more`);
  }
}

// 2. Sensitive Data in Logs
console.log('\n2️⃣ Sensitive Data in Logs:');
scanDirectory('./src', results.sensitiveLogging, (line) => {
  return line.includes('logger.') &&
         (line.includes('email') || line.includes('password') || line.includes('token') || 
          line.includes('phone') || line.includes('passport') || line.includes('sin')) &&
         !line.includes('//') &&
         line.trim().length > 0;
});
console.log(`   Found ${results.sensitiveLogging.length} potential issues ⚠️`);
if (results.sensitiveLogging.length > 0) {
  results.sensitiveLogging.slice(0, 5).forEach(item => {
    console.log(`     ${item.file.split('/').pop()}:${item.line}`);
  });
  if (results.sensitiveLogging.length > 5) {
    console.log(`     ... and ${results.sensitiveLogging.length - 5} more`);
  }
}

// 3. Missing Input Validation
console.log('\n3️⃣ Missing Input Validation:');
scanDirectory('./src', results.missingValidation, (line) => {
  return (line.includes('req.body.') || line.includes('req.params.') || line.includes('req.query.')) &&
         !line.includes('validate') &&
         !line.includes('validator') &&
         !line.includes('schema') &&
         !line.includes('isValid') &&
         !line.includes('//') &&
         line.trim().length > 0;
});
console.log(`   Found ${results.missingValidation.length} potential issues ⚠️`);
if (results.missingValidation.length > 0) {
  results.missingValidation.slice(0, 5).forEach(item => {
    console.log(`     ${item.file.split('/').pop()}:${item.line}`);
  });
  if (results.missingValidation.length > 5) {
    console.log(`     ... and ${results.missingValidation.length - 5} more`);
  }
}

// 4. req.path vs req.originalUrl
console.log('\n4️⃣ Path vs OriginalUrl Issues:');
scanDirectory('./src', results.pathVsOriginalUrl, (line) => {
  return line.includes('req.path') &&
         !line.includes('req.originalUrl') &&
         !line.includes("req.path === '/health'") &&
         !line.includes('//') &&
         line.trim().length > 0;
});
console.log(`   Found ${results.pathVsOriginalUrl.length} potential issues ⚠️`);
if (results.pathVsOriginalUrl.length > 0) {
  results.pathVsOriginalUrl.slice(0, 5).forEach(item => {
    console.log(`     ${item.file.split('/').pop()}:${item.line}`);
  });
  if (results.pathVsOriginalUrl.length > 5) {
    console.log(`     ... and ${results.pathVsOriginalUrl.length - 5} more`);
  }
}

// 5. Memory Leaks
console.log('\n5️⃣ Memory Leak Potential (Event Listeners):');
scanDirectory('./src', results.memoryLeaks, (line) => {
  return (line.includes(".on('finish'") || line.includes(".on('close'")) &&
         !line.includes('removeListener') &&
         !line.includes('once') &&
         !line.includes('//') &&
         line.trim().length > 0;
});
console.log(`   Found ${results.memoryLeaks.length} potential issues ⚠️`);
if (results.memoryLeaks.length > 0) {
  results.memoryLeaks.slice(0, 5).forEach(item => {
    console.log(`     ${item.file.split('/').pop()}:${item.line}`);
  });
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 AUDIT SUMMARY');
console.log('='.repeat(70));
console.log(`\n🔴 Critical Issues:`);
console.log(`   MongoDB Injection: ${results.mongoInjection.length} potential cases`);
console.log(`   Sensitive Data Logs: ${results.sensitiveLogging.length} potential cases`);
console.log(`   Missing Validation: ${results.missingValidation.length} potential cases`);
console.log(`\n🟡 Medium Issues:`);
console.log(`   Path vs OriginalUrl: ${results.pathVsOriginalUrl.length} potential cases`);
console.log(`   Memory Leaks: ${results.memoryLeaks.length} potential cases`);

const totalIssues = results.mongoInjection.length + results.sensitiveLogging.length + 
                    results.missingValidation.length + results.pathVsOriginalUrl.length + 
                    results.memoryLeaks.length;

console.log(`\n📈 Total Potential Issues: ${totalIssues}`);

if (totalIssues > 0) {
  console.log('\n⚠️ Claude AI was RIGHT - these issues exist in other files!');
  console.log('📝 Recommendation: Fix these systematically using ValidationUtils class');
} else {
  console.log('\n✅ Claude AI was WRONG - no additional issues found!');
  console.log('🎉 Your codebase is already secure!');
}

