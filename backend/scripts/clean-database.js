/**
 * Clean Database Script
 * Removes all existing sample data from the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
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

    // Collections to clean (keep system collections)
    const collectionsToClean = [
      'users',
      'tenants', 
      'tenantteammembers',
      'tenant_team_members',
      'teammembers',
      'endusers',
      'superadmins',
      'superadmin'
    ];

    console.log('\n🧹 Cleaning collections...');
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`✅ Cleaned ${collectionName}: ${count} documents removed`);
        } else {
          console.log(`ℹ️  ${collectionName}: already empty`);
        }
      } catch (error) {
        console.log(`⚠️  ${collectionName}: collection doesn't exist or error occurred`);
      }
    }

    console.log('\n✅ Database cleaning completed successfully!');
    console.log('All sample data has been removed.');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

cleanDatabase();
