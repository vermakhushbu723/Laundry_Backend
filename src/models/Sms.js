import mongoose from 'mongoose';

const smsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  smsId: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['inbox', 'sent'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index for userId and smsId to prevent duplicates
smsSchema.index({ userId: 1, smsId: 1 }, { unique: true });

// Index for date for sorting
smsSchema.index({ date: -1 });

export default mongoose.model('Sms', smsSchema);
