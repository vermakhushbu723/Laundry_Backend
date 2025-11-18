import Service from '../models/Service.js';

/**
 * @desc    Get all services (public access)
 * @route   GET /api/services
 * @access  Public
 */
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all services including inactive (admin only)
 * @route   GET /api/services/all
 * @access  Admin
 */
export const getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (req, res) => {
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
      message: 'Failed to fetch service',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Admin
 */
export const createService = async (req, res) => {
  try {
    const { name, description, price, icon, image, estimatedDays } = req.body;

    // Validation
    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and price',
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    // Check if service with same name exists
    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists',
      });
    }

    // Create service
    const service = await Service.create({
      name,
      description,
      price,
      icon,
      image,
      estimatedDays: estimatedDays || 2,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message,
    });
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Admin
 */
export const updateService = async (req, res) => {
  try {
    const { name, description, price, icon, image, estimatedDays, isActive } =
      req.body;

    // Find service
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    // Check if changing name to existing name
    if (name && name !== service.name) {
      const existingService = await Service.findOne({ name });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this name already exists',
        });
      }
    }

    // Update fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (price !== undefined) service.price = price;
    if (icon !== undefined) service.icon = icon;
    if (image !== undefined) service.image = image;
    if (estimatedDays !== undefined) service.estimatedDays = estimatedDays;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete service (soft delete - set isActive to false)
 * @route   DELETE /api/services/:id
 * @access  Admin
 */
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Soft delete - just set isActive to false
    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message,
    });
  }
};

/**
 * @desc    Permanently delete service
 * @route   DELETE /api/services/:id/permanent
 * @access  Admin
 */
export const permanentDeleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service permanently deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle service active status
 * @route   PATCH /api/services/:id/toggle
 * @access  Admin
 */
export const toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle service status',
      error: error.message,
    });
  }
};
