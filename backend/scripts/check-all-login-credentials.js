const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  subdomain: { type: String },
  adminEmail: { type: String, required: true },
  adminPassword: { type: String, required: true },
  adminFirstName: { type: String, required: true },
  adminLastName: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);
const TenantTeamMember = mongoose.model('TenantTeamMember', tenantTeamMemberSchema);

async function checkAllCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 CHECKING ALL LOGIN CREDENTIALS...\n');

    // 1. Check Super Admin
    console.log('1️⃣ SUPER ADMIN:');
    const superAdmin = await User.findOne({ userType: 'super_admin' });
    if (superAdmin) {
      console.log('   ✅ Found in User collection');
      console.log('   📧 Email:', superAdmin.email);
      console.log('   👤 Type:', superAdmin.userType);
      console.log('   📊 Status:', superAdmin.status);
    } else {
      console.log('   ❌ Not found in User collection');
    }
    console.log('');

    // 2. Check Tenant Admins
    console.log('2️⃣ TENANT ADMINS:');
    const tenantAdmins = await User.find({ userType: 'tenant_admin' });
    if (tenantAdmins.length > 0) {
      console.log('   ✅ Found', tenantAdmins.length, 'in User collection');
      tenantAdmins.forEach((admin, index) => {
        console.log(`   📧 ${index + 1}. Email: ${admin.email}`);
        console.log(`   👤 Type: ${admin.userType}`);
        console.log(`   📊 Status: ${admin.status}`);
      });
    } else {
      console.log('   ❌ No tenant admins found in User collection');
    }
    console.log('');

    // 3. Check Team Members
    console.log('3️⃣ TEAM MEMBERS:');
    const teamMembers = await TenantTeamMember.find({});
    if (teamMembers.length > 0) {
      console.log('   ✅ Found', teamMembers.length, 'in TenantTeamMember collection');
      teamMembers.forEach((member, index) => {
        console.log(`   📧 ${index + 1}. Email: ${member.email}`);
        console.log(`   👤 Role: ${member.role}`);
        console.log(`   📊 Status: ${member.status}`);
      });
    } else {
      console.log('   ❌ No team members found in TenantTeamMember collection');
    }
    console.log('');

    // 4. Check Clients/Users
    console.log('4️⃣ CLIENTS/USERS:');
    const clients = await User.find({ userType: 'client' });
    if (clients.length > 0) {
      console.log('   ✅ Found', clients.length, 'in User collection');
      clients.forEach((client, index) => {
        console.log(`   📧 ${index + 1}. Email: ${client.email}`);
        console.log(`   👤 Type: ${client.userType}`);
        console.log(`   📊 Status: ${client.status}`);
      });
    } else {
      console.log('   ❌ No clients found in User collection');
    }
    console.log('');

    // 5. Check Tenants
    console.log('5️⃣ TENANTS:');
    const tenants = await Tenant.find({});
    if (tenants.length > 0) {
      console.log('   ✅ Found', tenants.length, 'in Tenant collection');
      tenants.forEach((tenant, index) => {
        console.log(`   🏢 ${index + 1}. Name: ${tenant.name}`);
        console.log(`   📧 Admin Email: ${tenant.adminEmail}`);
        console.log(`   🌐 Domain: ${tenant.domain}`);
      });
    } else {
      console.log('   ❌ No tenants found in Tenant collection');
    }

  } catch (error) {
    console.error('❌ Error checking credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔗 Database connection closed');
  }
}

checkAllCredentials();
