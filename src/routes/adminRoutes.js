import express from 'express';
import { adminProtect } from '../middleware/auth.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', adminProtect, async (req, res) => {
  try {
    console.log('🔹 Fetching admin dashboard stats...');

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Get order stats
    const orders = await Order.find();
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const pickedOrders = orders.filter(o => o.status === 'picked').length;
    const inProcessOrders = orders.filter(o => o.status === 'in-process').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    // Calculate revenue (assuming amount field exists in orders)
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + (order.amount || 0), 0);

    // Get recent data
    const recentUsers = await User.find()
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrders = await Order.find()
      .populate('userId', 'name phoneNumber')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      overview: {
        totalUsers,
        totalServices,
        totalOrders,
        pendingOrders,
        totalRevenue,
      },
      orderStats: {
        pending: pendingOrders,
        picked: pickedOrders,
        inProcess: inProcessOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      recent: {
        users: recentUsers,
        orders: recentOrders,
      },
    };

    console.log('✅ Admin stats fetched successfully');

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/sms-logs:
 *   get:
 *     summary: Get all SMS logs from users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SMS logs retrieved successfully
 */
router.get('/sms-logs', adminProtect, async (req, res) => {
  try {
    console.log('🔹 Fetching all SMS logs...');

    // Get all users who have SMS permission enabled
    const users = await User.find({ 
      smsPermission: true,
      'smsLogs.0': { $exists: true } // Only users with SMS logs
    }).select('name phoneNumber smsLogs');

    // Flatten SMS logs with user info
    const allSmsLogs = [];
    users.forEach(user => {
      if (user.smsLogs && user.smsLogs.length > 0) {
        user.smsLogs.forEach(log => {
          allSmsLogs.push({
            _id: log._id,
            userName: user.name,
            userPhone: user.phoneNumber,
            userId: user._id,
            message: log.message,
            from: log.from,
            date: log.date,
          });
        });
      }
    });

    // Sort by date (newest first)
    allSmsLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('✅ SMS logs fetched:', allSmsLogs.length);

    res.status(200).json({
      success: true,
      count: allSmsLogs.length,
      smsLogs: allSmsLogs,
    });
  } catch (error) {
    console.error('❌ Error fetching SMS logs:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/contacts:
 *   get:
 *     summary: Get all contacts from users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 */
router.get('/contacts', adminProtect, async (req, res) => {
  try {
    console.log('🔹 Fetching all contacts...');

    // Get all users who have contact permission enabled
    const users = await User.find({ 
      contactPermission: true,
      'contacts.0': { $exists: true } // Only users with contacts
    }).select('name phoneNumber contacts');

    // Flatten contacts with user info
    const allContacts = [];
    users.forEach(user => {
      if (user.contacts && user.contacts.length > 0) {
        user.contacts.forEach(contact => {
          allContacts.push({
            _id: contact._id,
            userName: user.name,
            userPhone: user.phoneNumber,
            userId: user._id,
            contactName: contact.name,
            contactPhone: contact.phoneNumber,
          });
        });
      }
    });

    // Remove duplicate contacts based on phone number
    const uniqueContacts = [];
    const phoneSet = new Set();
    
    allContacts.forEach(contact => {
      if (contact.contactPhone && !phoneSet.has(contact.contactPhone)) {
        phoneSet.add(contact.contactPhone);
        uniqueContacts.push(contact);
      }
    });

    console.log('✅ Contacts fetched:', uniqueContacts.length);

    res.status(200).json({
      success: true,
      count: uniqueContacts.length,
      totalWithDuplicates: allContacts.length,
      contacts: uniqueContacts,
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/marketing-stats:
 *   get:
 *     summary: Get marketing statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marketing stats retrieved successfully
 */
router.get('/marketing-stats', adminProtect, async (req, res) => {
  try {
    console.log('🔹 Fetching marketing stats...');

    const totalUsers = await User.countDocuments();
    const usersWithSmsPermission = await User.countDocuments({ smsPermission: true });
    const usersWithContactPermission = await User.countDocuments({ contactPermission: true });
    
    const usersWithSmsLogs = await User.countDocuments({ 
      smsPermission: true,
      'smsLogs.0': { $exists: true }
    });
    
    const usersWithContacts = await User.countDocuments({ 
      contactPermission: true,
      'contacts.0': { $exists: true }
    });

    // Count total SMS logs
    const usersWithLogs = await User.find({ 
      smsPermission: true,
      'smsLogs.0': { $exists: true }
    }).select('smsLogs');
    
    let totalSmsLogs = 0;
    usersWithLogs.forEach(user => {
      totalSmsLogs += user.smsLogs?.length || 0;
    });

    // Count total contacts
    const usersWithContactsList = await User.find({ 
      contactPermission: true,
      'contacts.0': { $exists: true }
    }).select('contacts');
    
    let totalContacts = 0;
    usersWithContactsList.forEach(user => {
      totalContacts += user.contacts?.length || 0;
    });

    const stats = {
      totalUsers,
      smsPermission: {
        enabled: usersWithSmsPermission,
        withLogs: usersWithSmsLogs,
        totalLogs: totalSmsLogs,
      },
      contactPermission: {
        enabled: usersWithContactPermission,
        withContacts: usersWithContacts,
        totalContacts,
      },
    };

    console.log('✅ Marketing stats fetched');

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching marketing stats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 */
router.get('/profile', adminProtect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    
    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', adminProtect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { name, email, phone },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/change-password:
 *   put:
 *     summary: Change admin password (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put('/change-password', adminProtect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const admin = await Admin.findById(req.admin._id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
