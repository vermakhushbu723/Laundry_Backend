import express from 'express';
import { protect, adminProtect } from '../middleware/auth.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpiry');
    
    res.status(200).json({
      success: true,
      user,
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
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
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
 *               address:
 *                 type: string
 *               smsPermission:
 *                 type: boolean
 *               contactPermission:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, address, smsPermission, contactPermission } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (smsPermission !== undefined) updateData.smsPermission = smsPermission;
    if (contactPermission !== undefined) updateData.contactPermission = contactPermission;
    
    // Mark profile as complete if name and address are provided
    if (name && address) {
      updateData.isProfileComplete = true;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-otp -otpExpiry');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
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
 * /api/user/dashboard:
 *   get:
 *     summary: Get dashboard stats and recent orders
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.user._id).select('-otp -otpExpiry');
    
    // Get all user orders
    const orders = await Order.find({ userId: req.user._id })
      .populate('serviceId')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const pendingOrders = orders.filter(o => ['pending', 'picked', 'in-process'].includes(o.status)).length;

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        pendingOrders,
      },
      recentOrders,
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
 * /api/user/all:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users retrieved successfully
 */
router.get('/all', adminProtect, async (req, res) => {
  try {
    const users = await User.find().select('-otp -otpExpiry').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      users,
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
 * /api/user/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 */
router.get('/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      user,
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
 * /api/user/{id}:
 *   put:
 *     summary: Update user by ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', adminProtect, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, address },
      { new: true }
    ).select('-otp -otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
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
 * /api/user/{id}:
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
