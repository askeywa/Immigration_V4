/**
 * Check API Response for Subscription Plans
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'admin@system.com';
const TEST_PASSWORD = 'admin123';

let authToken = '';

async function login() {
  const response = await axios.post(`${BASE_URL}/auth/login/super-admin`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (response.data.success) {
    authToken = response.data.data.tokens.accessToken;
    console.log('✅ Login successful');
    return true;
  }
  return false;
}

async function checkAPIResponse() {
  console.log('🔍 Checking API Response for Subscription Plans...\n');
  
  if (!(await login())) {
    console.log('❌ Login failed');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/super-admin/subscription-plans?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', response.headers);
    console.log('\n📄 Full API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const plans = response.data.data.data;
      const pagination = response.data.data.pagination;
      
      console.log('\n📊 Response Analysis:');
      console.log(`   Success: ${response.data.success}`);
      console.log(`   Plans Count: ${plans.length}`);
      console.log(`   Pagination: Page ${pagination.page}/${pagination.totalPages} (${pagination.total} total)`);
      
      if (plans.length > 0) {
        console.log('\n📋 Plans Found:');
        plans.forEach((plan, index) => {
          console.log(`   ${index + 1}. ${plan.name} - $${plan.pricing.monthly}/month (${plan.status})`);
          console.log(`      ID: ${plan.id}`);
          console.log(`      Slug: ${plan.slug}`);
          console.log(`      Features: ${Object.keys(plan.features).filter(k => plan.features[k]).length} enabled`);
        });
      } else {
        console.log('\n❌ No plans in response data');
      }
    } else {
      console.log('\n❌ API returned success: false');
      console.log('   Error:', response.data.error);
    }
    
  } catch (error) {
    console.log('❌ API call failed:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data);
  }
}

checkAPIResponse().catch(console.error);
