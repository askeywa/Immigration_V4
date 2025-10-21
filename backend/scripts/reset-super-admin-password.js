/**
 * Reset Super Admin Password
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetSuperAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-immigration');
    console.log('Connected to MongoDB');

    const SuperAdmin = mongoose.model('SuperAdmin', new mongoose.Schema({
      email: String,
      password: String,
      firstName: String,
      lastName: String
    }));

    const newPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await SuperAdmin.updateOne(
      { email: 'admin@system.com' },
      { password: hashedPassword }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Super Admin password reset successfully');
      console.log(`   Email: admin@system.com`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ Failed to reset password - Super Admin not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

resetSuperAdminPassword();
