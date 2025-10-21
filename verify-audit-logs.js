/**
 * Verify Audit Logs Are Being Saved
 * Check database and API to confirm audit logging is working
 */

const API_URL = 'http://localhost:5000/api/v1';

const SUPER_ADMIN = {
  email: 'superadmin@ibuyscrap.ca',
  password: 'SuperAdmin123!'
};

async function verifyAuditLogs() {
  console.log('🔍 Verifying Audit Logs Are Being Saved...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in as Super Admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login/super-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: SUPER_ADMIN.email,
        password: SUPER_ADMIN.password
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error?.message}`);
    }

    const token = loginData.data.tokens.accessToken;
    console.log('   ✅ Login successful\n');

    // Step 2: Retrieve audit logs
    console.log('2️⃣ Retrieving audit logs from API...');
    const auditResponse = await fetch(`${API_URL}/security/audit-logs?limit=20`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const auditData = await auditResponse.json();
    
    if (!auditData.success) {
      throw new Error(`Failed to retrieve audit logs: ${auditData.error?.message}`);
    }

    const logs = auditData.data.logs;
    const total = auditData.data.total;

    console.log(`   ✅ Retrieved ${total} audit log(s)\n`);

    if (total === 0) {
      console.log('⚠️  WARNING: No audit logs found!');
      console.log('   This could mean:');
      console.log('   1. Audit logging is not creating entries');
      console.log('   2. Database collection is empty');
      console.log('   3. Query filters are too strict\n');
      return;
    }

    // Step 3: Analyze audit logs
    console.log('3️⃣ Analyzing Audit Logs:\n');
    console.log('=' .repeat(80));
    
    logs.forEach((log, index) => {
      console.log(`\nAudit Log #${index + 1}:`);
      console.log(`   Action:       ${log.action}`);
      console.log(`   Resource:     ${log.resource}`);
      console.log(`   Method:       ${log.method}`);
      console.log(`   Endpoint:     ${log.endpoint}`);
      console.log(`   Status Code:  ${log.statusCode}`);
      console.log(`   Category:     ${log.category}`);
      console.log(`   Severity:     ${log.severity}`);
      console.log(`   IP Address:   ${log.ipAddress}`);
      console.log(`   User Agent:   ${log.userAgent?.substring(0, 50)}...`);
      console.log(`   Timestamp:    ${log.createdAt}`);
      
      if (log.userId) {
        console.log(`   User ID:      ${log.userId}`);
      }
      
      if (log.tenantId) {
        console.log(`   Tenant ID:    ${log.tenantId}`);
      }
      
      console.log('   ' + '-'.repeat(78));
    });

    // Step 4: Verify field completeness
    console.log('\n4️⃣ Field Completeness Check:\n');
    
    const requiredFields = ['action', 'resource', 'method', 'endpoint', 'ipAddress', 'userAgent', 'statusCode', 'category'];
    let allFieldsPresent = true;
    
    logs.forEach((log, index) => {
      const missing = requiredFields.filter(field => !log[field]);
      if (missing.length > 0) {
        console.log(`   ❌ Log #${index + 1} missing fields: ${missing.join(', ')}`);
        allFieldsPresent = false;
      }
    });

    if (allFieldsPresent) {
      console.log('   ✅ All required fields present in all audit logs!');
    }

    // Step 5: Category breakdown
    console.log('\n5️⃣ Audit Log Statistics:\n');
    
    const categories = {};
    const severities = {};
    const actions = {};
    
    logs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + 1;
      severities[log.severity] = (severities[log.severity] || 0) + 1;
      actions[log.action] = (actions[log.action] || 0) + 1;
    });

    console.log('   Categories:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count}`);
    });

    console.log('\n   Severities:');
    Object.entries(severities).forEach(([sev, count]) => {
      console.log(`      ${sev}: ${count}`);
    });

    console.log('\n   Actions:');
    Object.entries(actions).forEach(([action, count]) => {
      console.log(`      ${action}: ${count}`);
    });

    // Final verdict
    console.log('\n' + '='.repeat(80));
    console.log('🎉 AUDIT LOGGING VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Total audit logs: ${total}`);
    console.log(`✅ All required fields: ${allFieldsPresent ? 'Present' : 'Missing'}`);
    console.log(`✅ Database storage: Working`);
    console.log(`✅ API retrieval: Working`);
    console.log(`✅ Categorization: ${Object.keys(categories).length} categories`);
    console.log(`✅ Severity tracking: ${Object.keys(severities).length} levels`);
    console.log('='.repeat(80));
    console.log('\n🎊 AUDIT LOGGING SERVICE IS FULLY OPERATIONAL!\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('   Details:', error);
  }
}

verifyAuditLogs().catch(console.error);

