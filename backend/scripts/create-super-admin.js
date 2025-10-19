/**
 * Create Super Admin Script
 * Creates a super admin user for testing
 */

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

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ userType: 'super_admin' });
    if (existingAdmin) {
      console.log('Super admin already exists:', existingAdmin.email);
      console.log('Email: admin@system.com');
      console.log('Password: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create super admin user
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@system.com',
      password: hashedPassword,
      userType: 'super_admin',
      status: 'active'
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully!');
    console.log('Email: admin@system.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

createSuperAdmin();
