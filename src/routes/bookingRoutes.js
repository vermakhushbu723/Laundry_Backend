import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateOrderStatus,
} from '../controllers/bookingController.js';

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
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
 *               - pickupDate
 *               - pickupTime
 *             properties:
 *               serviceId:
 *                 type: string
 *               pickupDate:
 *                 type: string
 *                 format: date
 *               pickupTime:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', protect, createBooking);

/**
 * @swagger
 * /api/bookings/user:
 *   get:
 *     summary: Get user bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/user', protect, getUserBookings);

/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Get all bookings (Admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bookings retrieved successfully
 */
router.get('/all', protect, getAllBookings);

/**
 * @swagger
 * /api/bookings/{orderId}:
 *   put:
 *     summary: Update order status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
router.put('/:orderId', protect, updateOrderStatus);

export default router;
