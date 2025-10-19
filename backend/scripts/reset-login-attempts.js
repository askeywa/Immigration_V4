const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['client', 'team_member', 'tenant_admin', 'super_admin'], default: 'client' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const superAdminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

async function resetLoginAttempts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔓 RESETTING LOGIN ATTEMPTS...\n');

    // Reset Super Admin login attempts
    const superAdminResult = await SuperAdmin.updateMany(
      { email: 'admin@system.com' },
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { status: 'active' }
      }
    );
    console.log('✅ Super Admin login attempts reset:', superAdminResult.modifiedCount, 'account(s)');

    // Reset all User login attempts (tenant admins and clients)
    const userResult = await User.updateMany(
      {},
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 }
      }
    );
    console.log('✅ User login attempts reset:', userResult.modifiedCount, 'account(s)');

    // Check current status
    console.log('\n📊 CURRENT STATUS:');
    
    const superAdmin = await SuperAdmin.findOne({ email: 'admin@system.com' });
    if (superAdmin) {
      console.log('👑 Super Admin:');
      console.log('   Email:', superAdmin.email);
      console.log('   Login Attempts:', superAdmin.loginAttempts || 0);
      console.log('   Locked Until:', superAdmin.lockUntil || 'Not locked');
      console.log('   Status:', superAdmin.status);
    }

    const lockedUsers = await User.find({ 
      $or: [
        { loginAttempts: { $gte: 5 } },
        { lockUntil: { $exists: true, $ne: null } }
      ]
    });
    
    if (lockedUsers.length > 0) {
      console.log('\n🔒 Previously locked users:');
      lockedUsers.forEach(user => {
        console.log(`   ${user.email} (${user.userType}) - Attempts: ${user.loginAttempts}, Locked: ${user.lockUntil || 'No'}`);
      });
    } else {
      console.log('\n✅ No locked users found');
    }

    console.log('\n🎉 All login attempts have been reset!');
    console.log('You can now try logging in again.');

  } catch (error) {
    console.error('❌ Error resetting login attempts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔗 Database connection closed');
  }
}

resetLoginAttempts();
