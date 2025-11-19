import express from 'express';
import { protect } from '../middleware/auth.js';
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, address },
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

export default router;
