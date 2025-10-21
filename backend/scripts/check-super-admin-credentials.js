/**
 * Check Super Admin Credentials
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-immigration');
    console.log('Connected to MongoDB');

    const SuperAdmin = mongoose.model('SuperAdmin', new mongoose.Schema({
      email: String,
      password: String,
      firstName: String,
      lastName: String
    }));

    const superAdmins = await SuperAdmin.find({});
    console.log('\nSuper Admins found:');
    
    if (superAdmins.length === 0) {
      console.log('❌ No Super Admins found in database');
    } else {
      superAdmins.forEach((admin, index) => {
        console.log(`\n${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   ID: ${admin._id}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSuperAdmin();
