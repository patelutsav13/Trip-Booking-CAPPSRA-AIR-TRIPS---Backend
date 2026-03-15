const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  airline: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  images: [{ type: String }],
  availableSeats: { type: Number, required: true, default: 50 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  category: { type: String, default: 'International' },
  highlights: [{ type: String }],
  isActive: { type: Boolean, default: true },
  departureTime: { type: String, default: '08:00 AM' },
  arrivalTime: { type: String, default: '12:00 PM' },
  flightClass: { type: String, enum: ['Economy', 'Business', 'First'], default: 'Economy' },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
