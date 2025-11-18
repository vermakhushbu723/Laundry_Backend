import express from 'express';
import { protect, adminProtect } from '../middleware/auth.js';
import {
  getAllServices,
  getAllServicesAdmin,
  getServiceById,
  createService,
  updateService,
  deleteService,
  permanentDeleteService,
  toggleServiceStatus,
} from '../controllers/serviceController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated service ID
 *         name:
 *           type: string
 *           description: Service name
 *         description:
 *           type: string
 *           description: Service description
 *         price:
 *           type: number
 *           description: Service price
 *         icon:
 *           type: string
 *           description: Service icon (emoji or icon name)
 *         image:
 *           type: string
 *           description: Service image URL
 *         isActive:
 *           type: boolean
 *           description: Service active status
 *         estimatedDays:
 *           type: number
 *           description: Estimated delivery days
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         name: Wash & Iron
 *         description: Complete washing and ironing service
 *         price: 150
 *         icon: 👕
 *         estimatedDays: 2
 *         isActive: true
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all active services (Public)
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       500:
 *         description: Server error
 */
router.get('/', getAllServices);

/**
 * @swagger
 * /api/services/all:
 *   get:
 *     summary: Get all services including inactive (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/all', protect, adminProtect, getAllServicesAdmin);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getServiceById);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create new service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               icon:
 *                 type: string
 *               image:
 *                 type: string
 *               estimatedDays:
 *                 type: number
 *             example:
 *               name: Wash & Iron
 *               description: Complete washing and ironing service
 *               price: 150
 *               icon: 👕
 *               estimatedDays: 2
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', protect, adminProtect, createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               icon:
 *                 type: string
 *               image:
 *                 type: string
 *               estimatedDays:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *             example:
 *               name: Wash & Iron
 *               description: Updated description
 *               price: 180
 *               estimatedDays: 2
 *               isActive: true
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, adminProtect, updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete service - soft delete (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, adminProtect, deleteService);

/**
 * @swagger
 * /api/services/{id}/permanent:
 *   delete:
 *     summary: Permanently delete service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service permanently deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/permanent', protect, adminProtect, permanentDeleteService);

/**
 * @swagger
 * /api/services/{id}/toggle:
 *   patch:
 *     summary: Toggle service active status (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/toggle', protect, adminProtect, toggleServiceStatus);

export default router;