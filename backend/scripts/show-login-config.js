require('dotenv').config();

console.log('🔧 LOGIN ATTEMPT CONFIGURATION');
console.log('================================\n');

// Helper function to format duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Helper function to get config value
function getConfig(key, defaultValue) {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

const configs = [
  {
    name: 'Super Admin',
    attempts: getConfig('SUPER_ADMIN_MAX_LOGIN_ATTEMPTS', 30),
    duration: getConfig('SUPER_ADMIN_LOCKOUT_DURATION_MS', 60000)
  },
  {
    name: 'Tenant Admin',
    attempts: getConfig('TENANT_ADMIN_MAX_LOGIN_ATTEMPTS', 30),
    duration: getConfig('TENANT_ADMIN_LOCKOUT_DURATION_MS', 60000)
  },
  {
    name: 'Team Member',
    attempts: getConfig('TEAM_MEMBER_MAX_LOGIN_ATTEMPTS', 30),
    duration: getConfig('TEAM_MEMBER_LOCKOUT_DURATION_MS', 60000)
  },
  {
    name: 'Client',
    attempts: getConfig('CLIENT_MAX_LOGIN_ATTEMPTS', 30),
    duration: getConfig('CLIENT_LOCKOUT_DURATION_MS', 60000)
  }
];

configs.forEach(config => {
  console.log(`👤 ${config.name}:`);
  console.log(`   Max Attempts: ${config.attempts}`);
  console.log(`   Lockout Duration: ${formatDuration(config.duration)}`);
  console.log('');
});

console.log('📋 ENVIRONMENT SETTINGS:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('');

console.log('💡 TO CHANGE SETTINGS:');
console.log('   1. Edit the .env file in the backend directory');
console.log('   2. Update the values for each user type');
console.log('   3. Restart the backend server');
console.log('');

console.log('🔒 PRODUCTION RECOMMENDATIONS:');
console.log('   • Set all MAX_LOGIN_ATTEMPTS to 3');
console.log('   • Set all LOCKOUT_DURATION_MS to 1800000 (30 minutes)');
console.log('   • Example: SUPER_ADMIN_MAX_LOGIN_ATTEMPTS=3');
console.log('   • Example: SUPER_ADMIN_LOCKOUT_DURATION_MS=1800000');
