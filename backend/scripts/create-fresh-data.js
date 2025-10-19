/**
 * Create Fresh Data Script
 * Creates new sample data with the updated schema (no application fields for users)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

// Define User schema (for super_admin and client) - NO APPLICATION FIELDS
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'TenantTeamMember' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userType: { type: String, enum: ['super_admin', 'tenant_admin', 'team_member', 'client'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'suspended'], default: 'pending' },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  profile: {
    avatar: { type: String },
    phone: { type: String },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    dateOfBirth: { type: Date },
    nationality: { type: String },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  metadata: {
    signupSource: { type: String },
    lastIpAddress: { type: String },
    userAgent: { type: String },
    timezone: { type: String },
    referralSource: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

const User = mongoose.model('User', userSchema);

// Define TenantTeamMember schema
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

async function createFreshData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create tenants
    const tenants = [
      {
        name: 'ABC Immigration Services',
        domain: 'abcimmigration.com',
        adminEmail: 'admin@abcimmigration.com',
        adminPassword: hashedPassword,
        adminFirstName: 'John',
        adminLastName: 'Smith',
        settings: { maxTeamMembers: 10, maxClients: 500 },
        subscription: { plan: 'premium', maxTeamMembers: 10, maxClients: 500 }
      },
      {
        name: 'XYZ Consultant',
        domain: 'xyzconsultant.com',
        adminEmail: 'admin@xyzconsultant.com',
        adminPassword: hashedPassword,
        adminFirstName: 'Sarah',
        adminLastName: 'Johnson',
        settings: { maxTeamMembers: 5, maxClients: 200 },
        subscription: { plan: 'basic', maxTeamMembers: 5, maxClients: 200 }
      },
      {
        name: 'DEF Legal Services',
        domain: 'deflegal.com',
        adminEmail: 'admin@deflegal.com',
        adminPassword: hashedPassword,
        adminFirstName: 'Michael',
        adminLastName: 'Brown',
        settings: { maxTeamMembers: 8, maxClients: 300 },
        subscription: { plan: 'premium', maxTeamMembers: 8, maxClients: 300 }
      },
      {
        name: 'GHI Immigration Solutions',
        domain: 'ghiimmigration.com',
        adminEmail: 'admin@ghiimmigration.com',
        adminPassword: hashedPassword,
        adminFirstName: 'Emily',
        adminLastName: 'Davis',
        settings: { maxTeamMembers: 15, maxClients: 1000 },
        subscription: { plan: 'enterprise', maxTeamMembers: 15, maxClients: 1000 }
      }
    ];

    const createdTenants = await Tenant.insertMany(tenants);
    console.log(`✅ Created ${createdTenants.length} tenants`);

    // Create super admin
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@system.com',
      password: hashedPassword,
      userType: 'super_admin',
      status: 'active',
      emailVerified: true
    });
    await superAdmin.save();
    console.log('✅ Created super admin');

    const usersToCreate = [];
    const teamMembersToCreate = [];

    // Create tenant admins, team members, and clients for each tenant
    for (const tenant of createdTenants) {
      // Tenant Admin
      usersToCreate.push({
        tenantId: tenant._id,
        firstName: tenant.adminFirstName,
        lastName: tenant.adminLastName,
        email: tenant.adminEmail,
        password: hashedPassword,
        userType: 'tenant_admin',
        status: 'active',
        emailVerified: true
      });

      // Team Members (3 per tenant)
      for (let i = 1; i <= 3; i++) {
        teamMembersToCreate.push({
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

      // Clients (5 per tenant) - NO APPLICATION FIELDS
      for (let i = 1; i <= 5; i++) {
        usersToCreate.push({
          tenantId: tenant._id,
          firstName: `Client${i}`,
          lastName: 'User',
          email: `client${i}@${tenant.domain}`,
          password: hashedPassword,
          userType: 'client',
          status: 'active',
          emailVerified: true
        });
      }
    }

    const createdUsers = await User.insertMany(usersToCreate);
    const createdTeamMembers = await TenantTeamMember.insertMany(teamMembersToCreate);
    console.log(`✅ Created ${createdUsers.length} users and ${createdTeamMembers.length} team members`);

    // Display login credentials
    console.log('\n🔑 FRESH LOGIN CREDENTIALS:');
    console.log('='.repeat(50));

    console.log('\n👑 SUPER ADMIN:');
    console.log('Email: admin@system.com');
    console.log('Password: password123');
    console.log('URL: http://localhost:5174/super-admin/dashboard');

    console.log('\n🏢 TENANT ADMINS:');
    for (const tenant of createdTenants) {
      console.log(`\n${tenant.name}:`);
      console.log(`Email: ${tenant.adminEmail}`);
      console.log('Password: password123');
      console.log('URL: http://localhost:5174/tenant-admin/dashboard');
    }

    console.log('\n👥 TEAM MEMBERS:');
    for (const tenant of createdTenants) {
      console.log(`\n${tenant.name}:`);
      for (let i = 1; i <= 3; i++) {
        console.log(`Email: team${i}@${tenant.domain}`);
        console.log('Password: password123');
        console.log('URL: http://localhost:5174/team-member/dashboard');
      }
    }

    console.log('\n👤 CLIENTS (NO APPLICATION FIELDS REQUIRED):');
    for (const tenant of createdTenants) {
      console.log(`\n${tenant.name}:`);
      for (let i = 1; i <= 5; i++) {
        console.log(`Email: client${i}@${tenant.domain}`);
        console.log('Password: password123');
        console.log('URL: http://localhost:5174/client/dashboard');
      }
    }

    console.log('\n✅ Fresh data creation completed successfully!');
    console.log('\n📝 IMPORTANT CHANGES:');
    console.log('- Client users no longer require applicationType or application fields');
    console.log('- Users can register without specifying immigration application details');
    console.log('- Team members still have required fields (created by tenant admins)');

  } catch (error) {
    console.error('❌ Error creating fresh data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

createFreshData();
