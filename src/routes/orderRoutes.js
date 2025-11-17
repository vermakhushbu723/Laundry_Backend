import express from 'express';
import { protect } from '../middleware/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('serviceId')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const pending = orders.filter(o => o.status === 'pending').length;

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        delivered,
        cancelled,
        pending,
      },
      orders,
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
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - serviceName
 *               - pickupDate
 *               - pickupTime
 *               - address
 *             properties:
 *               serviceId:
 *                 type: string
 *               serviceName:
 *                 type: string
 *               pickupDate:
 *                 type: string
 *                 format: date-time
 *               pickupTime:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', protect, async (req, res) => {
  try {
    console.log('🔹 Creating new order...');
    console.log('User ID:', req.user._id);
    console.log('Request Body:', req.body);

    const { serviceId, serviceName, pickupDate, pickupTime, address, notes, amount } = req.body;

    // Validation
    if (!serviceId || !serviceName || !pickupDate || !pickupTime || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      serviceId,
      serviceName,
      pickupDate: new Date(pickupDate),
      pickupTime,
      address,
      notes,
      amount,
      customerName: req.user.name,
      customerPhone: req.user.phoneNumber,
    });

    console.log('✅ Order created:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('serviceId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      order,
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
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order
 *     tags: [Orders]
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
 *         description: Order cancelled successfully
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    console.log('🔹 Cancelling order:', req.params.id);

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    order.status = 'cancelled';
    await order.save();

    console.log('✅ Order cancelled successfully');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, picked, in-process, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch('/:id/status', protect, async (req, res) => {
  try {
    console.log('🔹 Updating order status:', req.params.id);
    console.log('New status:', req.body.status);

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'picked', 'in-process', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status;
    await order.save();

    console.log('✅ Order status updated successfully');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin route - Get all orders with stats
router.get('/all', protect, async (req, res) => {
  try {
    console.log('🔹 Admin fetching all orders...');

    const orders = await Order.find()
      .populate('userId', 'name phoneNumber email')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const picked = orders.filter(o => o.status === 'picked').length;
    const inProcess = orders.filter(o => o.status === 'in-process').length;

    console.log('✅ All orders fetched:', totalOrders);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        delivered,
        cancelled,
        pending,
        picked,
        inProcess,
      },
      orders,
    });
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin route - Get orders stats only
router.get('/stats', protect, async (req, res) => {
  try {
    console.log('🔹 Fetching order stats...');

    const orders = await Order.find();

    const stats = {
      totalOrders: orders.length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      pending: orders.filter(o => o.status === 'pending').length,
      picked: orders.filter(o => o.status === 'picked').length,
      inProcess: orders.filter(o => o.status === 'in-process').length,
    };

    console.log('✅ Stats fetched:', stats);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
