/**
 * Migration script to fix user emails that were created before email normalization
 * This script will lowercase all user emails in the database
 * 
 * Usage: node backend/scripts/fixUserEmails.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixUserEmails = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      const originalEmail = user.email;
      const normalizedEmail = originalEmail.toLowerCase();

      // Only update if email needs normalization
      if (originalEmail !== normalizedEmail) {
        // Check if normalized email already exists (duplicate)
        const existingUser = await User.findOne({ 
          email: normalizedEmail,
          _id: { $ne: user._id }
        });

        if (existingUser) {
          console.log(`⚠️  Skipping ${originalEmail} - normalized email ${normalizedEmail} already exists for user ${existingUser._id}`);
          skipped++;
        } else {
          user.email = normalizedEmail;
          await user.save();
          console.log(`✓ Updated: ${originalEmail} → ${normalizedEmail}`);
          updated++;
        }
      } else {
        skipped++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);

    await mongoose.connection.close();
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixUserEmails();

