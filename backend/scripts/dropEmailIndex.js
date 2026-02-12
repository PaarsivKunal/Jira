/**
 * Migration script to drop the old single-field email_1 index
 * This allows the compound index (email + organization) to work properly
 * 
 * Usage: node backend/scripts/dropEmailIndex.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const dropEmailIndex = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.collection('users');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if email_1 index exists
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    
    if (emailIndex) {
      console.log('\n⚠️  Found old email_1 index. Dropping it...');
      await collection.dropIndex('email_1');
      console.log('✓ Successfully dropped email_1 index');
    } else {
      console.log('\n✓ email_1 index not found. It may have already been removed.');
    }

    // Verify compound index exists
    const compoundIndex = indexes.find(idx => 
      idx.name === 'email_1_organization_1' || 
      (idx.key && idx.key.email === 1 && idx.key.organization === 1)
    );

    if (compoundIndex) {
      console.log('✓ Compound index (email + organization) is present');
    } else {
      console.log('⚠️  Compound index (email + organization) not found. It should be created automatically by Mongoose.');
    }

    // List indexes again to confirm
    const updatedIndexes = await collection.indexes();
    console.log('\nUpdated indexes:');
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    await mongoose.connection.close();
    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    
    // If index doesn't exist, that's okay
    if (error.code === 27 || error.message?.includes('index not found')) {
      console.log('✓ Index already removed or does not exist');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
};

dropEmailIndex();

