const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define SuperAdmin schema (matches backend model)
const superAdminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@system.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if super admin already exists
    let superAdmin = await SuperAdmin.findOne({ email });

    if (superAdmin) {
      console.log('Super admin already exists. Updating password...');
      superAdmin.password = hashedPassword;
      superAdmin.status = 'active';
      superAdmin.loginAttempts = 0;
      superAdmin.lockUntil = undefined;
      await superAdmin.save();
    } else {
      superAdmin = new SuperAdmin({
        firstName: 'Super',
        lastName: 'Admin',
        email,
        password: hashedPassword,
        status: 'active',
      });
      await superAdmin.save();
    }

    console.log('✅ Super admin created/updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

createSuperAdmin();
