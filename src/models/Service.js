import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  icon: {
    type: String,
  },
  image: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  estimatedDays: {
    type: Number,
    default: 2,
  },
}, {
  timestamps: true,
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;
