const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['client', 'team_member', 'tenant_admin', 'super_admin'], default: 'client' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const superAdminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  adminEmail: { type: String, required: true },
  adminPassword: { type: String, required: true },
  adminFirstName: { type: String, required: true },
  adminLastName: { type: String, required: true },
  adminLoginAttempts: { type: Number, default: 0 },
  adminLockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const tenantTeamMemberSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'viewer'], default: 'staff' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);
const TenantTeamMember = mongoose.model('TenantTeamMember', tenantTeamMemberSchema);

async function resetAllLoginAttempts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔓 RESETTING ALL LOGIN ATTEMPTS...\n');

    // Reset Super Admin login attempts
    const superAdminResult = await SuperAdmin.updateMany(
      { email: 'admin@system.com' },
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { status: 'active' }
      }
    );
    console.log('✅ Super Admin login attempts reset:', superAdminResult.modifiedCount, 'account(s)');

    // Reset all User login attempts (tenant admins and clients)
    const userResult = await User.updateMany(
      {},
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 }
      }
    );
    console.log('✅ User login attempts reset:', userResult.modifiedCount, 'account(s)');

    // Reset Tenant admin login attempts
    const tenantResult = await Tenant.updateMany(
      {},
      { 
        $unset: { adminLoginAttempts: 1, adminLockUntil: 1 }
      }
    );
    console.log('✅ Tenant admin login attempts reset:', tenantResult.modifiedCount, 'account(s)');

    // Reset Team Member login attempts
    const teamMemberResult = await TenantTeamMember.updateMany(
      {},
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 }
      }
    );
    console.log('✅ Team Member login attempts reset:', teamMemberResult.modifiedCount, 'account(s)');

    // Check current status
    console.log('\n📊 CURRENT STATUS:');
    
    const superAdmin = await SuperAdmin.findOne({ email: 'admin@system.com' });
    if (superAdmin) {
      console.log('👑 Super Admin:');
      console.log('   Email:', superAdmin.email);
      console.log('   Login Attempts:', superAdmin.loginAttempts || 0);
      console.log('   Locked Until:', superAdmin.lockUntil || 'Not locked');
      console.log('   Status:', superAdmin.status);
    }

    const tenants = await Tenant.find({}).limit(3);
    if (tenants.length > 0) {
      console.log('\n🏢 Tenant Admins:');
      tenants.forEach(tenant => {
        console.log(`   ${tenant.adminEmail} (${tenant.name})`);
        console.log(`   Login Attempts: ${tenant.adminLoginAttempts || 0}`);
        console.log(`   Locked Until: ${tenant.adminLockUntil || 'Not locked'}`);
      });
    }

    const teamMembers = await TenantTeamMember.find({}).limit(3);
    if (teamMembers.length > 0) {
      console.log('\n👥 Team Members:');
      teamMembers.forEach(member => {
        console.log(`   ${member.email} (${member.role})`);
        console.log(`   Login Attempts: ${member.loginAttempts || 0}`);
        console.log(`   Locked Until: ${member.lockUntil || 'Not locked'}`);
      });
    }

    const clients = await User.find({ userType: 'client' }).limit(3);
    if (clients.length > 0) {
      console.log('\n👤 Clients:');
      clients.forEach(client => {
        console.log(`   ${client.email}`);
        console.log(`   Login Attempts: ${client.loginAttempts || 0}`);
        console.log(`   Locked Until: ${client.lockUntil || 'Not locked'}`);
      });
    }

    console.log('\n🎉 ALL LOGIN ATTEMPTS HAVE BEEN RESET!');
    console.log('📋 NEW LOGIN LIMITS:');
    console.log('   • Max Attempts: 10 (increased from 5)');
    console.log('   • Lockout Duration: 30 minutes (reduced from 2 hours)');
    console.log('   • Applies to: All user types (Super Admin, Tenant Admin, Team Member, Client)');
    console.log('\nYou can now try logging in again with any user type.');

  } catch (error) {
    console.error('❌ Error resetting login attempts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔗 Database connection closed');
  }
}

resetAllLoginAttempts();
