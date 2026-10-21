import mongoose from 'mongoose';

const vehicleLotSchema = new mongoose.Schema(
  {
    lotNumber: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    make: {
      type: String,
      required: true,
      index: true
    },
    model: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    vin: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['insurance', 'bank-nbfc', 'used-vehicle', 'used-spare-parts'],
      default: 'insurance',
      index: true
    },
    condition: {
      type: String,
      enum: ['Clean Title', 'Salvage / Repairable', 'Bank Repossession', 'Parts Only'],
      default: 'Salvage / Repairable'
    },
    damageType: {
      type: String,
      default: 'Front End Impact'
    },
    primaryDamage: {
      type: String,
      default: 'Front Bumper / Radiator Core'
    },
    secondaryDamage: {
      type: String,
      default: 'Hood & Left Fender'
    },
    odometer: {
      type: Number,
      default: 0
    },
    fuelType: {
      type: String,
      default: 'Diesel'
    },
    transmission: {
      type: String,
      default: 'Automatic'
    },
    location: {
      type: String,
      required: true,
      index: true
    },
    yardLocation: {
      type: String,
      default: 'Bengaluru Central Salvage Yard'
    },
    startingBid: {
      type: Number,
      required: true
    },
    currentBid: {
      type: Number,
      default: function () {
        return this.startingBid;
      }
    },
    minIncrement: {
      type: Number,
      default: 25000
    },
    bidCount: {
      type: Number,
      default: 0
    },
    reservePrice: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended', 'settled'],
      default: 'upcoming',
      index: true
    },
    readyToLift: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    images: [
      {
        type: String
      }
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    currentHighBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('VehicleLot', vehicleLotSchema);
