const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define User schema (matches backend model)
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

const User = mongoose.model('User', userSchema);

async function checkSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check for super admin in User collection
    const superAdmin = await User.findOne({ userType: 'super_admin' });
    if (superAdmin) {
      console.log('✅ Super Admin found in User collection:');
      console.log('Email:', superAdmin.email);
      console.log('UserType:', superAdmin.userType);
      console.log('Status:', superAdmin.status);
      console.log('Created:', superAdmin.createdAt);
    } else {
      console.log('❌ No super admin found in User collection');
    }

    // Also check SuperAdmin collection
    const SuperAdminModel = mongoose.model('SuperAdmin', new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));

    const superAdminFromCollection = await SuperAdminModel.findOne({});
    if (superAdminFromCollection) {
      console.log('✅ Super Admin found in SuperAdmin collection:');
      console.log('Email:', superAdminFromCollection.email);
      console.log('Status:', superAdminFromCollection.status);
      console.log('Created:', superAdminFromCollection.createdAt);
    } else {
      console.log('❌ No super admin found in SuperAdmin collection');
    }

  } catch (error) {
    console.error('❌ Error checking super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

checkSuperAdmin();
