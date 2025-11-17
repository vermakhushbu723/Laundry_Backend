import express from 'express';
import Service from '../models/Service.js';

const router = express.Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all active services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      count: services.length,
      services,
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
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *       404:
 *         description: Service not found
 */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
