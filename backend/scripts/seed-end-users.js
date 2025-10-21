/**
 * Seed End Users Script
 * Populates the database with end users (clients) for all tenants
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define User schema (matches backend model for end users/clients)
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['client', 'team_member', 'tenant_admin', 'super_admin'], default: 'client' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  applicationStatus: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'completed'],
    default: 'not_started'
  },
  profile: {
    dateOfBirth: { type: Date },
    nationality: { type: String },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      province: { type: String },
      postalCode: { type: String },
      country: { type: String }
    }
  },
  application: {
    type: { 
      type: String, 
      enum: ['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration'],
      default: 'visitor_visa'
    },
    documents: [{
      name: { type: String },
      type: { type: String },
      url: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],
    progress: { type: Number, default: 0, min: 0, max: 100 }
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

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

async function seedEndUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants`);

    // Clear existing end users
    await User.deleteMany({ userType: 'client' });
    console.log('Cleared existing end users');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create end users for each tenant
    const endUsers = [];

    for (const tenant of tenants) {
      const tenantEndUsers = [
        {
          tenantId: tenant._id,
          firstName: 'Alice',
          lastName: 'Brown',
          email: `alice.brown@${tenant.domain}`,
          password: hashedPassword,
          userType: 'client',
          status: 'active',
          applicationStatus: 'in_progress',
          profile: {
            dateOfBirth: new Date('1990-05-15'),
            nationality: 'Indian',
            phone: '+1-416-555-0101',
            address: {
              street: '123 Main St',
              city: 'Toronto',
              province: 'ON',
              postalCode: 'M5V 3A8',
              country: 'Canada'
            }
          },
          application: {
            type: 'permanent_residence',
            progress: 45
          },
          lastLogin: new Date()
        },
        {
          tenantId: tenant._id,
          firstName: 'Bob',
          lastName: 'Davis',
          email: `bob.davis@${tenant.domain}`,
          password: hashedPassword,
          userType: 'client',
          status: 'active',
          applicationStatus: 'submitted',
          profile: {
            dateOfBirth: new Date('1985-08-22'),
            nationality: 'Chinese',
            phone: '+1-604-555-0102',
            address: {
              street: '456 Oak Ave',
              city: 'Vancouver',
              province: 'BC',
              postalCode: 'V6B 1A1',
              country: 'Canada'
            }
          },
          application: {
            type: 'study_visa',
            progress: 80
          },
          lastLogin: new Date()
        },
        {
          tenantId: tenant._id,
          firstName: 'Catherine',
          lastName: 'Wilson',
          email: `catherine.wilson@${tenant.domain}`,
          password: hashedPassword,
          userType: 'client',
          status: 'active',
          applicationStatus: 'completed',
          profile: {
            dateOfBirth: new Date('1992-12-10'),
            nationality: 'Filipino',
            phone: '+1-514-555-0103',
            address: {
              street: '789 Pine St',
              city: 'Montreal',
              province: 'QC',
              postalCode: 'H3A 1B2',
              country: 'Canada'
            }
          },
          application: {
            type: 'work_permit',
            progress: 100
          },
          lastLogin: new Date()
        }
      ];

      // Add more end users for premium tenants
      if (tenant.plan === 'premium') {
        tenantEndUsers.push(
          {
            tenantId: tenant._id,
            firstName: 'Daniel',
            lastName: 'Miller',
            email: `daniel.miller@${tenant.domain}`,
            password: hashedPassword,
            userType: 'client',
            status: 'active',
            applicationStatus: 'under_review',
            profile: {
              dateOfBirth: new Date('1988-03-18'),
              nationality: 'Brazilian',
              phone: '+1-403-555-0104',
              address: {
                street: '321 Elm St',
                city: 'Calgary',
                province: 'AB',
                postalCode: 'T2P 1J9',
                country: 'Canada'
              }
            },
            application: {
              type: 'family_sponsorship',
              progress: 60
            },
            lastLogin: new Date()
          },
          {
            tenantId: tenant._id,
            firstName: 'Elena',
            lastName: 'Garcia',
            email: `elena.garcia@${tenant.domain}`,
            password: hashedPassword,
            userType: 'client',
            status: 'active',
            applicationStatus: 'in_progress',
            profile: {
              dateOfBirth: new Date('1995-07-25'),
              nationality: 'Mexican',
              phone: '+1-905-555-0105',
              address: {
                street: '654 Maple Dr',
                city: 'Mississauga',
                province: 'ON',
                postalCode: 'L5B 2N3',
                country: 'Canada'
              }
            },
            application: {
              type: 'visitor_visa',
              progress: 30
            },
            lastLogin: new Date()
          }
        );
      }

      endUsers.push(...tenantEndUsers);
    }

    // Insert end users
    const createdEndUsers = await User.insertMany(endUsers);
    console.log(`Successfully created ${createdEndUsers.length} end users`);

    // Show summary by tenant
    for (const tenant of tenants) {
      const count = createdEndUsers.filter(eu => eu.tenantId.toString() === tenant._id.toString()).length;
      console.log(`- ${tenant.name}: ${count} end users`);
    }

    console.log('\n✅ End users seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding end users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

seedEndUsers();
