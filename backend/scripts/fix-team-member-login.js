/**
 * Fix Team Member Login Script
 * Adds test team members to the correct TenantTeamMember collection
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define TenantTeamMember schema (matches backend model)
const tenantTeamMemberSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['visa_specialist', 'work_permit_specialist', 'admin', 'case_manager'], default: 'case_manager' },
  specializations: [{ type: String }],
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

const TenantTeamMember = mongoose.model('TenantTeamMember', tenantTeamMemberSchema);

// Define Tenant schema
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  subdomain: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
  adminEmail: { type: String, required: true },
  adminPassword: { type: String, required: true },
  adminFirstName: { type: String, required: true },
  adminLastName: { type: String, required: true },
  adminLastLogin: { type: Date },
  settings: {
    maxTeamMembers: { type: Number, default: 5 },
    maxClients: { type: Number, default: 1000 },
    maxStorage: { type: Number, default: 1000 },
    features: [{ type: String }],
    allowSelfRegistration: { type: Boolean, default: false },
    requireEmailVerification: { type: Boolean, default: true }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    maxTeamMembers: { type: Number, default: 5 },
    maxClients: { type: Number, default: 1000 },
    features: {
      visitorVisa: { type: Boolean, default: true },
      studyVisa: { type: Boolean, default: true },
      workPermit: { type: Boolean, default: true },
      permanentResidence: { type: Boolean, default: false },
      familySponsorship: { type: Boolean, default: false },
      businessImmigration: { type: Boolean, default: false }
    }
  },
  billing: {
    status: { type: String, enum: ['active', 'canceled', 'past_due', 'unpaid'], default: 'active' }
  },
  metadata: {
    rcicNumber: { type: String },
    businessAddress: { type: String },
    phone: { type: String },
    industry: { type: String },
    companySize: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Tenant = mongoose.model('Tenant', tenantSchema);

async function fixTeamMemberLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all tenants
    const tenants = await Tenant.find({});
    if (tenants.length === 0) {
      console.log('No tenants found. Please run seed-tenants.js first.');
      return;
    }

    console.log(`Found ${tenants.length} tenants`);

    // Clear existing test team members from TenantTeamMember collection
    await TenantTeamMember.deleteMany({ email: { $regex: /^team[1-3]@/ } });
    console.log('Cleared existing test team members from TenantTeamMember collection');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const testTeamMembers = [];

    // Create test team members for each tenant
    for (const tenant of tenants) {
      for (let i = 1; i <= 3; i++) {
        testTeamMembers.push({
          tenantId: tenant._id,
          firstName: `Team${i}`,
          lastName: 'Member',
          email: `team${i}@${tenant.domain}`,
          password: hashedPassword,
          role: 'case_manager',
          specializations: ['visitor_visa', 'study_visa'],
          permissions: ['view_clients', 'edit_clients', 'view_reports'],
          isActive: true
        });
      }
    }

    // Insert test team members
    const createdTeamMembers = await TenantTeamMember.insertMany(testTeamMembers);
    console.log(`Successfully created ${createdTeamMembers.length} test team members in TenantTeamMember collection`);

    // Display login credentials
    console.log('\n🔑 UPDATED TEAM MEMBER LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    
    console.log('\n👥 TEAM MEMBERS (now in correct collection):');
    for (const tenant of tenants) {
      console.log(`\n${tenant.name}:`);
      for (let i = 1; i <= 3; i++) {
        console.log(`Email: team${i}@${tenant.domain}`);
        console.log(`Password: password123`);
        console.log(`URL: http://localhost:5174/team-member/dashboard`);
      }
    }

    console.log('\n✅ Team member login fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing team member login:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

fixTeamMemberLogin();
