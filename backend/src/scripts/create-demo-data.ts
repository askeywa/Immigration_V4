/**
 * Create Demo Data Script
 * Creates demo credentials for all 4 user types for testing
 * 
 * Usage:
 * npx ts-node src/scripts/create-demo-data.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.config';
import { SuperAdmin } from '../models/superadmin.model';
import { Tenant } from '../models/tenant.model';
import { TenantTeamMember } from '../models/tenant-team-member.model';
import { User } from '../models/user.model';

/**
 * Demo Data
 */
const DEMO_DATA = {
  superAdmin: {
    email: 'superadmin@ibuyscrap.ca',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin' as const,
    permissions: [
      'manage_tenants',
      'manage_system_settings',
      'view_analytics',
      'manage_billing',
      'view_audit_logs',
      'manage_integrations',
      'system_maintenance'
    ]
  },
  
  tenant: {
    name: 'ABC Immigration Services',
    domain: 'abcimmigration.com',
    subdomain: 'abc',
    adminEmail: 'admin@abcimmigration.com',
    adminPassword: 'TenantAdmin123!',
    adminFirstName: 'John',
    adminLastName: 'Smith',
    plan: 'premium' as const,
    maxTeamMembers: 10,
    maxClients: 500,
    metadata: {
      rcicNumber: 'R123456',
      businessAddress: '123 Main St, Toronto, ON M5H 2N2',
      phone: '+1 (416) 555-1234'
    }
  },
  
  teamMembers: [
    {
      email: 'visa.specialist@abcimmigration.com',
      password: 'TeamMember123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'visa_specialist' as const,
      specializations: ['visitor_visa', 'study_visa']
    },
    {
      email: 'work.specialist@abcimmigration.com',
      password: 'TeamMember123!',
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'work_permit_specialist' as const,
      specializations: ['work_permit', 'permanent_residence']
    }
  ],
  
  clients: [
    {
      email: 'client1@example.com',
      password: 'Client123!',
      firstName: 'Raj',
      lastName: 'Patel',
      phone: '+1 (647) 555-1111',
      dateOfBirth: '1990-05-15',
      nationality: 'Indian',
      applicationType: 'study_visa' as const
    },
    {
      email: 'client2@example.com',
      password: 'Client123!',
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1 (647) 555-2222',
      dateOfBirth: '1985-08-22',
      nationality: 'Mexican',
      applicationType: 'work_permit' as const
    }
  ]
};

/**
 * Create demo data
 */
async function createDemoData() {
  try {
    console.log('🌱 Starting demo data creation...\n');
    
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${config.MONGO_URI.split('/').pop()?.split('?')[0]}\n`);
    
    // Step 1: Create Super Admin
    console.log('👑 Creating Super Admin...');
    const existingSuperAdmin = await SuperAdmin.findOne({ email: DEMO_DATA.superAdmin.email });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists, skipping...');
    } else {
      const hashedSuperAdminPassword = await bcrypt.hash(
        DEMO_DATA.superAdmin.password, 
        config.BCRYPT_SALT_ROUNDS
      );
      
      await SuperAdmin.create({
        ...DEMO_DATA.superAdmin,
        password: hashedSuperAdminPassword,
        isActive: true,
        loginAttempts: 0,
        profile: {
          timezone: 'America/Toronto',
          language: 'en'
        },
        preferences: {
          theme: 'system',
          dashboard: {
            layout: 'grid',
            widgets: []
          }
        }
      });
      
      console.log(`✅ Super Admin created: ${DEMO_DATA.superAdmin.email}`);
    }
    
    // Step 2: Create Tenant
    console.log('\n🏢 Creating Tenant (RCIC)...');
    const existingTenant = await Tenant.findOne({ adminEmail: DEMO_DATA.tenant.adminEmail });
    
    let tenant;
    if (existingTenant) {
      console.log('⚠️  Tenant already exists, skipping...');
      tenant = existingTenant;
    } else {
      const hashedTenantPassword = await bcrypt.hash(
        DEMO_DATA.tenant.adminPassword,
        config.BCRYPT_SALT_ROUNDS
      );
      
      tenant = await Tenant.create({
        ...DEMO_DATA.tenant,
        adminPassword: hashedTenantPassword,
        status: 'active',
        settings: {
          maxTeamMembers: DEMO_DATA.tenant.maxTeamMembers,
          maxClients: DEMO_DATA.tenant.maxClients,
          maxStorage: 5120, // 5GB
          features: [],
          allowSelfRegistration: false,
          requireEmailVerification: true,
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1D4ED8'
          }
        },
        subscription: {
          plan: DEMO_DATA.tenant.plan,
          maxTeamMembers: DEMO_DATA.tenant.maxTeamMembers,
          maxClients: DEMO_DATA.tenant.maxClients,
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
          customerId: '',
          subscriptionId: '',
          paymentMethod: 'credit_card',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'active'
        }
      });
      
      console.log(`✅ Tenant created: ${DEMO_DATA.tenant.name}`);
    }
    
    // Step 3: Create Team Members
    console.log('\n👥 Creating Team Members...');
    const teamMembers = [];
    
    for (const memberData of DEMO_DATA.teamMembers) {
      const existingMember = await TenantTeamMember.findOne({
        tenantId: tenant._id,
        email: memberData.email
      });
      
      if (existingMember) {
        console.log(`⚠️  Team member ${memberData.email} already exists, skipping...`);
        teamMembers.push(existingMember);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(
        memberData.password,
        config.BCRYPT_SALT_ROUNDS
      );
      
      const teamMember = await TenantTeamMember.create({
        tenantId: tenant._id,
        ...memberData,
        password: hashedPassword,
        isActive: true,
        loginAttempts: 0,
        permissions: [
          'view_clients',
          'edit_clients',
          'view_applications',
          'edit_applications'
        ],
        profile: {
          timezone: 'America/Toronto',
          language: 'en'
        },
        preferences: {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      });
      
      teamMembers.push(teamMember);
      console.log(`✅ Team member created: ${memberData.email} (${memberData.role})`);
    }
    
    // Step 4: Create Clients
    console.log('\n👤 Creating Clients...');
    
    for (let i = 0; i < DEMO_DATA.clients.length; i++) {
      const clientData = DEMO_DATA.clients[i];
      
      const existingClient = await User.findOne({
        tenantId: tenant._id,
        email: clientData.email
      });
      
      if (existingClient) {
        console.log(`⚠️  Client ${clientData.email} already exists, skipping...`);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(
        clientData.password,
        config.BCRYPT_SALT_ROUNDS
      );
      
      // Assign to team member (alternating)
      const assignedTo = teamMembers[i % teamMembers.length]._id;
      
      await User.create({
        tenantId: tenant._id,
        assignedTo,
        ...clientData,
        password: hashedPassword,
        status: 'active',
        emailVerified: true,
        loginAttempts: 0,
        profile: {
          phone: clientData.phone,
          dateOfBirth: clientData.dateOfBirth,
          nationality: clientData.nationality,
          timezone: 'America/Toronto',
          language: 'en'
        },
        application: {
          type: clientData.applicationType,
          status: 'submitted',
          documents: [],
          priority: 'medium'
        },
        preferences: {
          theme: 'system',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        }
      });
      
      console.log(`✅ Client created: ${clientData.email} (${clientData.applicationType})`);
    }
    
    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Demo data creation complete!\n');
    console.log('📋 DEMO CREDENTIALS:\n');
    
    console.log('👑 SUPER ADMIN:');
    console.log(`   Email: ${DEMO_DATA.superAdmin.email}`);
    console.log(`   Password: ${DEMO_DATA.superAdmin.password}`);
    console.log(`   Dashboard: http://localhost:5174 → Select "Super Admin"\n`);
    
    console.log('🏢 TENANT ADMIN (RCIC):');
    console.log(`   Email: ${DEMO_DATA.tenant.adminEmail}`);
    console.log(`   Password: ${DEMO_DATA.tenant.adminPassword}`);
    console.log(`   Dashboard: http://localhost:5174 → Select "RCIC Admin"\n`);
    
    console.log('👥 TEAM MEMBERS:');
    DEMO_DATA.teamMembers.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.email}`);
      console.log(`      Password: ${member.password}`);
      console.log(`      Role: ${member.role}`);
    });
    console.log(`   Dashboard: http://localhost:5174 → Select "Team Member"\n`);
    
    console.log('👤 CLIENTS:');
    DEMO_DATA.clients.forEach((client, i) => {
      console.log(`   ${i + 1}. ${client.email}`);
      console.log(`      Password: ${client.password}`);
      console.log(`      Type: ${client.applicationType}`);
    });
    console.log(`   Dashboard: http://localhost:5174 → Select "Client"\n`);
    
    console.log('='.repeat(60));
    console.log('✅ All demo accounts ready to use!');
    console.log('🚀 Start your servers and test the complete workflow!\n');
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createDemoData();
