import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  smsPermission: {
    type: Boolean,
    default: false,
  },
  contactPermission: {
    type: Boolean,
    default: false,
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  fcmToken: {
    type: String,
  },
  contacts: [{
    name: String,
    phoneNumber: String,
  }],
  smsLogs: [{
    message: String,
    date: Date,
    from: String,
  }],
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
