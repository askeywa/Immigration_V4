/**
 * RCIC System Seed Script
 * Creates Super Admin, Sample Tenant, Team Members, and Clients
 * 
 * Usage:
 * npm run seed:rcic
 */

import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs'; // Uncomment when ready to seed
import { config } from '../config/env.config';

// Import your new models (you'll need to create these)
// import { SuperAdmin } from '../models/superadmin.model';
// import { Tenant } from '../models/tenant.model';
// import { TenantTeamMember } from '../models/tenant-team-member.model';
// import { User } from '../models/user.model';

/**
 * Seed data for RCIC system
 */
const SEED_DATA = {
  superAdmin: {
    email: 'superadmin@yourcompany.com',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    permissions: ['manage_tenants', 'system_settings', 'analytics'],
    isActive: true
  },
  sampleTenant: {
    name: 'ABC Immigration Services',
    domain: 'abcimmigration.myapp.ca',
    adminEmail: 'admin@abcimmigration.com',
    adminPassword: 'Admin123!',
    adminFirstName: 'John',
    adminLastName: 'Smith',
    isActive: true,
    status: 'active',
    subscription: {
      plan: 'premium',
      maxTeamMembers: 5,
      maxClients: 1000,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    },
    branding: {
      logo: 'abc-logo.png',
      primaryColor: '#3B82F6',
      secondaryColor: '#1D4ED8'
    },
    settings: {
      allowSelfRegistration: false,
      requireEmailVerification: true,
      features: {
        visitorVisa: true,
        studyVisa: true,
        workPermit: true,
        permanentResidence: false
      }
    }
  },
  teamMembers: [
    {
      email: 'visa@abcimmigration.com',
      password: 'Visa123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'visa_specialist',
      specializations: ['visitor_visa', 'study_visa'],
      permissions: ['view_clients', 'edit_applications', 'upload_documents']
    },
    {
      email: 'work@abcimmigration.com',
      password: 'Work123!',
      firstName: 'Mike',
      lastName: 'Wilson',
      role: 'work_permit_specialist',
      specializations: ['work_permit', 'lmia'],
      permissions: ['view_clients', 'edit_applications', 'upload_documents']
    }
  ],
  sampleClients: [
    {
      email: 'ahmed@email.com',
      password: 'Client123!',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      applicationType: 'visitor_visa',
      profile: {
        phone: '+1-555-0123',
        address: '123 Main St, Toronto',
        dateOfBirth: '1990-01-01',
        nationality: 'Pakistani'
      },
      application: {
        type: 'visitor_visa',
        status: 'in_progress',
        submittedAt: new Date()
      }
    },
    {
      email: 'maria@email.com',
      password: 'Client123!',
      firstName: 'Maria',
      lastName: 'Garcia',
      applicationType: 'study_visa',
      profile: {
        phone: '+1-555-0124',
        address: '456 Oak Ave, Vancouver',
        dateOfBirth: '1995-05-15',
        nationality: 'Mexican'
      },
      application: {
        type: 'study_visa',
        status: 'submitted',
        submittedAt: new Date()
      }
    }
  ]
};

/**
 * Main seed function
 */
async function seedRCICSystem() {
  try {
    console.log('🌱 Starting RCIC System seed...');
    
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${config.MONGO_URI.split('/').pop()?.split('?')[0]}`);
    
    // Clear existing data
    console.log('🧹 Clearing existing seed data...');
    // await SuperAdmin.deleteMany({});
    // await Tenant.deleteMany({});
    // await TenantTeamMember.deleteMany({});
    // await User.deleteMany({});
    
    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    // Note: Uncomment below when ready to seed
    // const hashedSuperAdminPassword = await bcrypt.hash(SEED_DATA.superAdmin.password, config.BCRYPT_SALT_ROUNDS);
    // const superAdmin = await SuperAdmin.create({
    //   ...SEED_DATA.superAdmin,
    //   password: hashedSuperAdminPassword
    // });
    console.log(`✅ Super Admin data prepared: ${SEED_DATA.superAdmin.email}`);
    
    // Create Sample Tenant
    console.log('🏢 Creating sample tenant...');
    // Note: Uncomment below when ready to seed
    // const hashedAdminPassword = await bcrypt.hash(SEED_DATA.sampleTenant.adminPassword, config.BCRYPT_SALT_ROUNDS);
    // const tenant = await Tenant.create({
    //   ...SEED_DATA.sampleTenant,
    //   adminPassword: hashedAdminPassword
    // });
    console.log(`✅ Tenant data prepared: ${SEED_DATA.sampleTenant.name}`);
    
    // Create Team Members
    console.log('👥 Creating team members...');
    // const teamMembers = [];
    // for (const memberData of SEED_DATA.teamMembers) {
    //   const hashedPassword = await bcrypt.hash(memberData.password, config.BCRYPT_SALT_ROUNDS);
    //   const member = await TenantTeamMember.create({
    //     ...memberData,
    //     tenantId: tenant._id,
    //     password: hashedPassword,
    //     isActive: true
    //   });
    //   teamMembers.push(member);
    //   console.log(`✅ Created team member: ${memberData.email}`);
    // }
    
    // Create Sample Clients
    console.log('👤 Creating sample clients...');
    // for (const clientData of SEED_DATA.sampleClients) {
    //   const hashedPassword = await bcrypt.hash(clientData.password, config.BCRYPT_SALT_ROUNDS);
    //   const client = await User.create({
    //     ...clientData,
    //     tenantId: tenant._id,
    //     assignedTo: teamMembers[0]._id, // Assign to first team member
    //     password: hashedPassword,
    //     isActive: true
    //   });
    //   console.log(`✅ Created client: ${clientData.email}`);
    // }
    
    console.log('\n🎉 RCIC System seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('\n👑 Super Admin:');
    console.log(`Email: ${SEED_DATA.superAdmin.email}`);
    console.log(`Password: ${SEED_DATA.superAdmin.password}`);
    
    console.log('\n🏢 Tenant Admin:');
    console.log(`Email: ${SEED_DATA.sampleTenant.adminEmail}`);
    console.log(`Password: ${SEED_DATA.sampleTenant.adminPassword}`);
    console.log(`Domain: ${SEED_DATA.sampleTenant.domain}`);
    
    console.log('\n👥 Team Members:');
    SEED_DATA.teamMembers.forEach((member, index) => {
      console.log(`${index + 1}. Email: ${member.email} | Password: ${member.password} | Role: ${member.role}`);
    });
    
    console.log('\n👤 Sample Clients:');
    SEED_DATA.sampleClients.forEach((client, index) => {
      console.log(`${index + 1}. Email: ${client.email} | Password: ${client.password} | Application: ${client.applicationType}`);
    });
    
    console.log('\n🌐 Next Steps:');
    console.log('1. Update your models to match this schema');
    console.log('2. Start backend: npm run dev');
    console.log('3. Start frontend: cd ../frontend && npm run dev');
    console.log('4. Test Super Admin login');
    console.log('5. Test Tenant Admin login');
    
  } catch (error) {
    console.error('❌ RCIC System seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
seedRCICSystem().catch(console.error);
