/**
 * Seed Tenants Script
 * Populates the database with initial tenant data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define Tenant schema directly (simpler approach)
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

async function seedTenants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing tenants (optional - remove this line if you want to keep existing data)
    await Tenant.deleteMany({});
    console.log('Cleared existing tenants');

    // Hash password for admin users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create tenant data
    const tenants = [
      {
        name: 'ABC Immigration Services',
        domain: 'abcimmigration.com',
        subdomain: 'abc',
        status: 'active',
        plan: 'premium',
        adminEmail: 'admin@abcimmigration.com',
        adminPassword: hashedPassword,
        adminFirstName: 'John',
        adminLastName: 'Smith',
        adminLastLogin: new Date(),
        settings: {
          maxTeamMembers: 10,
          maxClients: 100,
          maxStorage: 5000,
          features: ['multi_tenant', 'custom_branding', 'advanced_analytics'],
          allowSelfRegistration: false,
          requireEmailVerification: true
        },
        subscription: {
          plan: 'premium',
          maxTeamMembers: 10,
          maxClients: 100,
          features: {
            visitorVisa: true,
            studyVisa: true,
            workPermit: true,
            permanentResidence: true,
            familySponsorship: true,
            businessImmigration: true
          }
        },
        billing: {
          status: 'active'
        },
        metadata: {
          rcicNumber: 'R123456',
          businessAddress: '123 Main St, Toronto, ON',
          phone: '+1-416-555-0123',
          industry: 'Immigration Services',
          companySize: '11-50'
        }
      },
      {
        name: 'XYZ Consultant',
        domain: 'xyzconsultant.com',
        subdomain: 'xyz',
        status: 'active',
        plan: 'basic',
        adminEmail: 'info@xyzconsultant.com',
        adminPassword: hashedPassword,
        adminFirstName: 'Raja',
        adminLastName: 'Ji',
        adminLastLogin: new Date(),
        settings: {
          maxTeamMembers: 5,
          maxClients: 50,
          maxStorage: 2000,
          features: ['multi_tenant'],
          allowSelfRegistration: false,
          requireEmailVerification: true
        },
        subscription: {
          plan: 'basic',
          maxTeamMembers: 5,
          maxClients: 50,
          features: {
            visitorVisa: true,
            studyVisa: true,
            workPermit: false,
            permanentResidence: true,
            familySponsorship: false,
            businessImmigration: false
          }
        },
        billing: {
          status: 'active'
        },
        metadata: {
          rcicNumber: 'R789012',
          businessAddress: '456 Queen St, Vancouver, BC',
          phone: '+1-604-555-0456',
          industry: 'Immigration Consulting',
          companySize: '1-10'
        }
      },
      {
        name: 'DEF Legal Services',
        domain: 'deflegal.com',
        subdomain: 'def',
        status: 'active',
        plan: 'premium',
        adminEmail: 'admin@deflegal.com',
        adminPassword: hashedPassword,
        adminFirstName: 'Sarah',
        adminLastName: 'Wilson',
        adminLastLogin: new Date(),
        settings: {
          maxTeamMembers: 8,
          maxClients: 75,
          maxStorage: 3000,
          features: ['multi_tenant', 'custom_branding', 'advanced_analytics'],
          allowSelfRegistration: false,
          requireEmailVerification: true
        },
        subscription: {
          plan: 'premium',
          maxTeamMembers: 8,
          maxClients: 75,
          features: {
            visitorVisa: true,
            studyVisa: true,
            workPermit: true,
            permanentResidence: true,
            familySponsorship: true,
            businessImmigration: false
          }
        },
        billing: {
          status: 'active'
        },
        metadata: {
          rcicNumber: 'R345678',
          businessAddress: '789 Bay St, Montreal, QC',
          phone: '+1-514-555-0789',
          industry: 'Legal Services',
          companySize: '11-50'
        }
      },
      {
        name: 'GHI Immigration Solutions',
        domain: 'ghiimmigration.com',
        subdomain: 'ghi',
        status: 'active',
        plan: 'basic',
        adminEmail: 'admin@ghiimmigration.com',
        adminPassword: hashedPassword,
        adminFirstName: 'Michael',
        adminLastName: 'Brown',
        adminLastLogin: new Date(),
        settings: {
          maxTeamMembers: 6,
          maxClients: 60,
          maxStorage: 2000,
          features: ['multi_tenant'],
          allowSelfRegistration: false,
          requireEmailVerification: true
        },
        subscription: {
          plan: 'basic',
          maxTeamMembers: 6,
          maxClients: 60,
          features: {
            visitorVisa: true,
            studyVisa: true,
            workPermit: false,
            permanentResidence: true,
            familySponsorship: false,
            businessImmigration: false
          }
        },
        billing: {
          status: 'active'
        },
        metadata: {
          rcicNumber: 'R901234',
          businessAddress: '321 King St, Calgary, AB',
          phone: '+1-403-555-0123',
          industry: 'Immigration Solutions',
          companySize: '1-10'
        }
      }
    ];

    // Insert tenants into database
    const createdTenants = await Tenant.insertMany(tenants);
    console.log(`Successfully created ${createdTenants.length} tenants:`);
    
    createdTenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.domain}) - ${tenant.plan} plan`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Re-enable API calls in your frontend');
    console.log('2. Remove mock data from frontend');
    console.log('3. See real data from your database');

  } catch (error) {
    console.error('❌ Error seeding tenants:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedTenants();
