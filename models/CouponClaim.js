const mongoose = require('mongoose');

const couponClaimSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  sentByAdmin: { type: Boolean, default: false },
  claimedAt: { type: Date, default: null },
  isClaimed: { type: Boolean, default: false },
  usedInBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('CouponClaim', couponClaimSchema);
