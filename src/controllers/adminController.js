import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 [BACKEND] Admin login attempt for:', email);

    if (!email || !password) {
      console.log('❌ [BACKEND] Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin
    console.log('🔍 [BACKEND] Searching for admin in database...');
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log('❌ [BACKEND] Admin not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ [BACKEND] Admin found:', admin.email);

    // Check password
    console.log('🔑 [BACKEND] Verifying password...');
    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      console.log('❌ [BACKEND] Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ [BACKEND] Password verified');

    // Check if admin is active
    if (!admin.isActive) {
      console.log('❌ [BACKEND] Admin account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    console.log('✅ [BACKEND] Admin is active');

    // Generate token
    const token = generateToken(admin._id);
    console.log('🎫 [BACKEND] Token generated:', token.substring(0, 20) + '...');

    const response = {
      success: true,
      message: 'Login successful',
      token,
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };

    console.log('✅ [BACKEND] Sending success response:', response.admin.email);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ [BACKEND] Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Admin (for initial setup)
export const createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
