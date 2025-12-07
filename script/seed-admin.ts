/**
 * Seed script to create an admin user
 * 
 * Usage:
 *   Development:
 *     ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="admin123" tsx script/seed-admin.ts
 * 
 *   Production:
 *     Use environment variables from your hosting platform
 */

import { storage } from "../server/storage";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || "admin";

  if (!email || !password) {
    console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
    console.error("\nUsage:");
    console.error('  ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="your-password" tsx script/seed-admin.ts');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: ADMIN_PASSWORD must be at least 8 characters long");
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const existingByEmail = await storage.getUserByEmail(email);
    if (existingByEmail) {
      console.log(`Admin user with email ${email} already exists`);
      console.log(`User ID: ${existingByEmail.id}`);
      process.exit(0);
    }

    const existingByUsername = await storage.getUserByUsername(username);
    if (existingByUsername) {
      console.log(`User with username ${username} already exists`);
      console.log(`User ID: ${existingByUsername.id}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await storage.createUser({
      username,
      email,
      password,
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   User ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log("\nYou can now login with these credentials.");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();

