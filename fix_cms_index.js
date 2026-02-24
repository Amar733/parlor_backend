const mongoose = require('mongoose');

require('dotenv').config();
// Use the actual MongoDB connection string from .env
const MONGODB_URI = process.env.MONGODB_URI.replace('/?', '/' + process.env.MONGODB_DB + '?');

async function fixCMSIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collection = db.collection('doctor_cms_content');
    
    console.log('Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Drop the problematic index
    try {
      await collection.dropIndex('page_1_section_1');
      console.log('✅ Dropped old problematic index: page_1_section_1');
    } catch (error) {
      console.log('ℹ️  Old index not found or already dropped');
    }
    
    // Ensure the correct compound index exists
    try {
      await collection.createIndex(
        { doctor_id: 1, page: 1, section: 1 }, 
        { unique: true, name: 'doctor_id_1_page_1_section_1' }
      );
      console.log('✅ Created correct compound index: doctor_id_1_page_1_section_1');
    } catch (error) {
      console.log('ℹ️  Correct index already exists');
    }
    
    console.log('Index fix completed successfully!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error fixing index:', error);
    process.exit(1);
  }
}

fixCMSIndex();