/**
 * Seed Team Members Script
 * Populates the database with team members for all tenants
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define Tenant Team Member schema (matches backend model)
const tenantTeamMemberSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'viewer'], default: 'staff' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLogin: { type: Date },
  permissions: {
    canManageClients: { type: Boolean, default: false },
    canManageTeamMembers: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TenantTeamMember = mongoose.model('TenantTeamMember', tenantTeamMemberSchema);

// Define Tenant schema (same as in seed-tenants.js)
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

async function seedTeamMembers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants`);

    // Clear existing team members
    await TenantTeamMember.deleteMany({});
    console.log('Cleared existing team members');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create team members for each tenant
    const teamMembers = [];

    for (const tenant of tenants) {
      const tenantTeamMembers = [
        {
          tenantId: tenant._id,
          firstName: 'John',
          lastName: 'Smith',
          email: `john@${tenant.domain}`,
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          lastLogin: new Date(),
          permissions: {
            canManageClients: true,
            canManageTeamMembers: true,
            canViewAnalytics: true,
            canManageSettings: true
          }
        },
        {
          tenantId: tenant._id,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: `sarah@${tenant.domain}`,
          password: hashedPassword,
          role: 'staff',
          status: 'active',
          lastLogin: new Date(),
          permissions: {
            canManageClients: true,
            canManageTeamMembers: false,
            canViewAnalytics: true,
            canManageSettings: false
          }
        }
      ];

      // Add more team members for premium tenants
      if (tenant.plan === 'premium') {
        tenantTeamMembers.push(
          {
            tenantId: tenant._id,
            firstName: 'Michael',
            lastName: 'Brown',
            email: `michael@${tenant.domain}`,
            password: hashedPassword,
            role: 'staff',
            status: 'active',
            lastLogin: new Date(),
            permissions: {
              canManageClients: true,
              canManageTeamMembers: false,
              canViewAnalytics: false,
              canManageSettings: false
            }
          },
          {
            tenantId: tenant._id,
            firstName: 'Emily',
            lastName: 'Davis',
            email: `emily@${tenant.domain}`,
            password: hashedPassword,
            role: 'viewer',
            status: 'active',
            lastLogin: new Date(),
            permissions: {
              canManageClients: false,
              canManageTeamMembers: false,
              canViewAnalytics: true,
              canManageSettings: false
            }
          }
        );
      }

      teamMembers.push(...tenantTeamMembers);
    }

    // Insert team members
    const createdTeamMembers = await TenantTeamMember.insertMany(teamMembers);
    console.log(`Successfully created ${createdTeamMembers.length} team members`);

    // Show summary by tenant
    for (const tenant of tenants) {
      const count = createdTeamMembers.filter(tm => tm.tenantId.toString() === tenant._id.toString()).length;
      console.log(`- ${tenant.name}: ${count} team members`);
    }

    console.log('\n✅ Team members seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding team members:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

seedTeamMembers();
