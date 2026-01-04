const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Create new admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@shop.com',
      password: 'admin123', // Simple password
      role: 'admin'
    });

    console.log('✅ Admin created successfully!');
    console.log('Email: admin@shop.com');
    console.log('Password: admin123');
    console.log('Role: admin');

    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();