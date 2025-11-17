import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './src/models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@laundry.com' });

    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('You can login with the existing password');
      process.exit(0);
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await Admin.create({
      email: 'admin@laundry.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin created successfully!');
    console.log('====================================');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Name:', admin.name);
    console.log('====================================');
    console.log('You can now login to admin panel!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
