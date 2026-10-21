import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleLot',
      required: true,
      index: true
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    bidType: {
      type: String,
      enum: ['standard', 'quick', 'proxy'],
      default: 'standard'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Bid', bidSchema);
