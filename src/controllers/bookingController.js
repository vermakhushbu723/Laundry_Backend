import Order from '../models/Order.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

// Create Booking
export const createBooking = async (req, res) => {
  try {
    const { serviceId, pickupDate, pickupTime, address, notes } = req.body;

    if (!serviceId || !pickupDate || !pickupTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Get service details
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Get user details
    const user = await User.findById(req.user._id);

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      serviceId,
      serviceName: service.name,
      pickupDate,
      pickupTime,
      amount: service.price,
      address: address || user.address,
      notes,
      customerName: user.name,
      customerPhone: user.phoneNumber,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('serviceId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Bookings (Admin)
export const getAllBookings = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId')
      .populate('serviceId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // TODO: Send notification to user

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
