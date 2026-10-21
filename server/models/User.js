import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['bidder', 'seller', 'admin'],
      default: 'bidder',
      index: true
    },
    mobile: {
      type: String,
      default: ''
    },
    organization: {
      type: String,
      default: ''
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    watchlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleLot'
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
