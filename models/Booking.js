const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  passportNo: { type: String, default: '' },
  seat: { type: String, default: '' },
});

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  tripPrice: { type: Number, required: true },
  travelDate: { type: Date, required: true },
  passengerCount: { type: Number, required: true, default: 1 },
  passengers: [passengerSchema],
  paymentStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
  couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  discountAmount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  ticketId: { type: String, unique: true },
  qrCode: { type: String, default: '' },
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  seatNumbers: [{ type: String }],
}, { timestamps: true });

bookingSchema.pre('save', function () {
  if (!this.ticketId) {
    this.ticketId = 'CPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
