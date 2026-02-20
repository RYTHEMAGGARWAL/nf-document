// Reset and recreate users with new schema
const mongoose = require('mongoose');
require('dotenv').config();

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop users collection
    try {
      await mongoose.connection.db.collection('users').drop();
      console.log('✅ Old users collection dropped');
    } catch (err) {
      console.log('ℹ️  No users collection to drop');
    }

    console.log('\n✅ Migration complete!');
    console.log('Now restart the server: node server.js');
    console.log('Default users will be created automatically.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateUsers();