/**
 * Fix Client Login Script
 * Updates client users with required application fields
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define User schema (matches backend model)
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'TenantTeamMember' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  applicationType: { 
    type: String, 
    enum: ['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'suspended'], 
    default: 'pending' 
  },
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
  application: {
    type: { 
      type: String, 
      enum: ['visitor_visa', 'study_visa', 'work_permit', 'permanent_residence', 'family_sponsorship', 'business_immigration'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress'], 
      default: 'draft' 
    },
    submittedAt: { type: Date },
    documents: [{ type: String }],
    notes: { type: String },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    }
  },
  preferences: {
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'system'], 
      default: 'system' 
    },
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

async function fixClientLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all client users
    const clientUsers = await User.find({ userType: 'client' });
    console.log(`Found ${clientUsers.length} client users`);

    if (clientUsers.length === 0) {
      console.log('No client users found. Please run create-test-users.js first.');
      return;
    }

    // Application types to assign to clients
    const applicationTypes = [
      'visitor_visa',
      'study_visa', 
      'work_permit',
      'permanent_residence',
      'family_sponsorship',
      'business_immigration'
    ];

    const applicationStatuses = [
      'draft',
      'submitted',
      'in_review',
      'approved',
      'rejected',
      'in_progress'
    ];

    // Update each client user
    for (let i = 0; i < clientUsers.length; i++) {
      const user = clientUsers[i];
      const appType = applicationTypes[i % applicationTypes.length];
      const appStatus = applicationStatuses[i % applicationStatuses.length];

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            applicationType: appType,
            application: {
              type: appType,
              status: appStatus,
              documents: [],
              priority: 'medium'
            },
            status: 'active', // Make them active so they can login
            emailVerified: true, // Mark as verified
            updatedAt: new Date()
          }
        }
      );

      console.log(`Updated ${user.email}: ${appType} (${appStatus})`);
    }

    console.log(`\n✅ Successfully updated ${clientUsers.length} client users`);

    // Display updated login credentials
    console.log('\n🔑 UPDATED CLIENT LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    
    const updatedUsers = await User.find({ userType: 'client' }).sort({ email: 1 });
    for (const user of updatedUsers) {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Password: password123`);
      console.log(`Application Type: ${user.applicationType}`);
      console.log(`Application Status: ${user.application.status}`);
      console.log(`URL: http://localhost:5174/client/dashboard`);
    }

    console.log('\n✅ Client login fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing client login:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

fixClientLogin();
