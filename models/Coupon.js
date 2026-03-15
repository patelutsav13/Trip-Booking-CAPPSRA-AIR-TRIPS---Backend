const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed', 'freebie'], required: true },
  discountValue: { type: Number, default: 0 },
  freebieDescription: { type: String, default: '' },
  image: { type: String, default: '' },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#6366f1' },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
