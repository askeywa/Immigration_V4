/**
 * Check Collections Script
 * Check what collections exist and their contents
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available Collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check User collection
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const userCount = await User.countDocuments();
    console.log(`\n👤 User collection: ${userCount} documents`);
    
    if (userCount > 0) {
      const teamMembers = await User.find({ userType: 'team_member' });
      console.log(`   - Team members: ${teamMembers.length}`);
      teamMembers.forEach(member => {
        console.log(`     * ${member.email} (${member.firstName} ${member.lastName})`);
      });
    }

    // Check TenantTeamMember collection
    const TenantTeamMember = mongoose.model('TenantTeamMember', new mongoose.Schema({}, { strict: false }));
    const teamMemberCount = await TenantTeamMember.countDocuments();
    console.log(`\n👥 TenantTeamMember collection: ${teamMemberCount} documents`);
    
    if (teamMemberCount > 0) {
      const teamMembers = await TenantTeamMember.find();
      teamMembers.forEach(member => {
        console.log(`   * ${member.email} (${member.firstName} ${member.lastName})`);
      });
    }

    // Check Tenant collection
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const tenantCount = await Tenant.countDocuments();
    console.log(`\n🏢 Tenant collection: ${tenantCount} documents`);

  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

checkCollections();
