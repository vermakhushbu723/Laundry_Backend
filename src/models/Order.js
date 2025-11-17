import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceId: {
    type: String, // Changed from ObjectId to String to accept mock service IDs
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  pickupDate: {
    type: Date,
    required: true,
  },
  pickupTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'picked', 'in-process', 'delivered', 'cancelled'],
    default: 'pending',
  },
  amount: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
  },
  notes: {
    type: String,
  },
  customerName: {
    type: String,
  },
  customerPhone: {
    type: String,
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
