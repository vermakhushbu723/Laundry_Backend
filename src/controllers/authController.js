import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate OTP (6 digits)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (Login/Signup)
export const sendOtp = async (req, res) => {
  try {
    console.log('🔹 Send OTP Request received');
    console.log('Request Body:', req.body);
    
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      console.log('❌ Phone number missing');
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log('❌ Invalid phone number format:', phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10 digit phone number',
      });
    }

    console.log('✅ Valid phone number:', phoneNumber);

    // Generate OTP (use static OTP if configured)
    const otp = process.env.STATIC_OTP || generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔑 Generated OTP:', otp);

    // Find or create user
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log('🆕 Creating new user');
      user = await User.create({
        phoneNumber,
        otp,
        otpExpiry,
      });
      console.log('✅ New user created:', user._id);
    } else {
      console.log('🔄 Updating existing user:', user._id);
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      console.log('✅ User updated');
    }

    // TODO: Send OTP via Twilio SMS
    console.log(`📧 OTP for ${phoneNumber}: ${otp}`);

    console.log('✅ Sending response');
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // Return OTP in development or when static OTP is set
      otp: (process.env.NODE_ENV === 'development' || process.env.STATIC_OTP) ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    console.log('🔹 Verify OTP Request received');
    console.log('Request Body:', req.body);
    
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      console.log('❌ Missing phoneNumber or OTP');
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    console.log('🔍 Finding user:', phoneNumber);
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ User found:', user._id);
    console.log('🔑 Stored OTP:', user.otp);
    console.log('🔑 Provided OTP:', otp);

    // Check OTP expiry
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        address: user.address,
        smsPermission: user.smsPermission,
        contactPermission: user.contactPermission,
        isProfileComplete: user.isProfileComplete || false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // TODO: Send OTP via Twilio SMS
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      // Remove this in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // For token-based auth, we just need to confirm logout
    // Client will clear the token from local storage
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
