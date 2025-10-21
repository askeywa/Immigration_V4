/**
 * Debug Frontend API Calls
 * Check if frontend is making API calls to backend
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5174';
const TEST_EMAIL = 'admin@system.com';
const TEST_PASSWORD = 'admin123';

async function debugFrontendAPI() {
  console.log('🔍 Debugging Frontend API Calls...\n');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    page = await browser.newPage();
    
    // Track network requests
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });
    
    // Navigate to frontend
    console.log('🌐 Navigating to frontend...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    // Login
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Navigate to subscription plans
    console.log('🧭 Navigating to subscription plans...');
    await page.goto(`${FRONTEND_URL}/super-admin/subscription-plans`, { waitUntil: 'networkidle2' });
    
    // Wait for any API calls
    console.log('⏳ Waiting for API calls...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Filter API requests
    const apiRequests = requests.filter(req => req.url.includes('/api/'));
    const apiResponses = responses.filter(res => res.url.includes('/api/'));
    
    console.log('\n📡 API Requests Found:');
    apiRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.method} ${req.url}`);
    });
    
    console.log('\n📡 API Responses Found:');
    apiResponses.forEach((res, index) => {
      console.log(`   ${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });
    
    // Check for subscription plan API calls specifically
    const subscriptionPlanRequests = apiRequests.filter(req => 
      req.url.includes('subscription-plans')
    );
    
    console.log('\n🎯 Subscription Plan API Requests:');
    if (subscriptionPlanRequests.length > 0) {
      subscriptionPlanRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log('   ❌ No subscription plan API requests found!');
    }
    
    // Check page content
    console.log('\n📄 Page Content Analysis:');
    const pageContent = await page.content();
    
    if (pageContent.includes('No plans found')) {
      console.log('   ❌ Page shows "No plans found"');
    } else {
      console.log('   ✅ Page does not show "No plans found"');
    }
    
    if (pageContent.includes('Starter Plan')) {
      console.log('   ✅ Page contains "Starter Plan"');
    } else {
      console.log('   ❌ Page does not contain "Starter Plan"');
    }
    
    if (pageContent.includes('Basic Plan')) {
      console.log('   ✅ Page contains "Basic Plan"');
    } else {
      console.log('   ❌ Page does not contain "Basic Plan"');
    }
    
    // Check for JavaScript errors
    console.log('\n🚨 JavaScript Errors:');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('   ✅ No JavaScript errors found');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'subscription-plans-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: subscription-plans-debug.png');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugFrontendAPI().catch(console.error);
