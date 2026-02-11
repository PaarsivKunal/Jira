/**
 * Migration Script: Add Organizations to Existing Data
 * 
 * This script migrates existing users and projects to the new organization-based structure.
 * 
 * Usage:
 *   node backend/scripts/migrateToOrganizations.js
 * 
 * IMPORTANT: Backup your database before running this script!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Organization from '../models/Organization.js';
import connectDB from '../config/database.js';

dotenv.config();

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const migrateToOrganizations = async () => {
  try {
    console.log('🔄 Starting migration to organizations...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all users without organizations (check both $exists: false and null)
    const usersWithoutOrg = await User.find({ 
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });
    console.log(`📊 Found ${usersWithoutOrg.length} users without organizations`);

    if (usersWithoutOrg.length === 0) {
      console.log('✅ All users already have organizations. Migration complete.');
      process.exit(0);
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutOrg) {
      try {
        // Extract organization name from email domain
        const emailDomain = user.email.split('@')[1];
        const orgName = emailDomain.split('.')[0].charAt(0).toUpperCase() + 
                       emailDomain.split('.')[0].slice(1);
        
        // Generate slug
        let slug = generateSlug(orgName);
        let counter = 1;
        let finalSlug = slug;
        
        // Ensure unique slug
        while (await Organization.findOne({ slug: finalSlug })) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }

        // Create organization for user
        const organization = await Organization.create({
          name: orgName,
          slug: finalSlug,
          domain: emailDomain,
          owner: user._id,
          members: [user._id],
        });

        // Update user with organization
        user.organization = organization._id;
        await user.save();

        // Update all projects created by this user
        const userProjects = await Project.find({ lead: user._id });
        for (const project of userProjects) {
          project.organization = organization._id;
          await project.save();
        }

        // Add user's projects to organization members if needed
        const projectMembers = userProjects.flatMap(p => p.members || []);
        const uniqueMembers = [...new Set([user._id.toString(), ...projectMembers.map(m => m.toString())])];
        
        organization.members = uniqueMembers.map(id => new mongoose.Types.ObjectId(id));
        await organization.save();

        migratedCount++;
        console.log(`✅ Migrated user: ${user.email} -> Organization: ${orgName}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    // Handle projects without organizations (orphaned projects)
    const projectsWithoutOrg = await Project.find({ organization: { $exists: false } });
    console.log(`📊 Found ${projectsWithoutOrg.length} projects without organizations`);

    for (const project of projectsWithoutOrg) {
      try {
        // Get project lead's organization
        const lead = await User.findById(project.lead);
        if (lead && lead.organization) {
          project.organization = lead.organization;
          await project.save();
          console.log(`✅ Assigned project ${project.name} to organization`);
        } else {
          // Create default organization for orphaned project
          const emailDomain = lead?.email?.split('@')[1] || 'default.com';
          const orgName = 'Default Organization';
          const slug = generateSlug(orgName);
          
          const organization = await Organization.create({
            name: orgName,
            slug: `${slug}-${Date.now()}`,
            domain: emailDomain,
            owner: lead?._id || new mongoose.Types.ObjectId(),
            members: lead?._id ? [lead._id] : [],
          });

          if (lead) {
            lead.organization = organization._id;
            await lead.save();
          }

          project.organization = organization._id;
          await project.save();
          console.log(`✅ Created default organization for orphaned project ${project.name}`);
        }
      } catch (error) {
        console.error(`❌ Error migrating project ${project.name}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('✅ Migration complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateToOrganizations();

