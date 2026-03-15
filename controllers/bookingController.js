const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const CouponClaim = require('../models/CouponClaim');
const Coupon = require('../models/Coupon');
const QRCode = require('qrcode');

exports.createBooking = async (req, res) => {
  try {
    const { tripId, travelDate, passengers, couponClaimId } = req.body;
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.availableSeats < passengers.length)
      return res.status(400).json({ message: 'Not enough seats available' });

    let discountAmount = 0;
    let couponApplied = null;

    if (couponClaimId) {
      const claim = await CouponClaim.findById(couponClaimId).populate('coupon');
      if (claim && !claim.isClaimed && claim.user.toString() === req.user._id.toString()) {
        const coupon = claim.coupon;
        const now = new Date();
        if (new Date(coupon.expiryDate) > now) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (trip.price * passengers.length * coupon.discountValue) / 100;
          } else if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
          }
          couponApplied = coupon._id;
          claim.isClaimed = true;
          claim.claimedAt = new Date();
          await claim.save();
        }
      }
    }

    const totalPrice = trip.price * passengers.length;
    const finalPrice = Math.max(0, totalPrice - discountAmount);

    const seatNumbers = passengers.map((_, i) => {
      const row = Math.floor(Math.random() * 30) + 1;
      const col = ['A','B','C','D','E','F'][Math.floor(Math.random() * 6)];
      return `${row}${col}`;
    });

    const booking = new Booking({
      user: req.user._id,
      trip: tripId,
      tripPrice: trip.price,
      travelDate,
      passengerCount: passengers.length,
      passengers,
      paymentStatus: 'confirmed',
      couponApplied,
      discountAmount,
      finalPrice,
      seatNumbers,
    });

    await booking.save();

    const qrData = JSON.stringify({ ticketId: booking.ticketId, trip: trip.name, user: req.user.name, finalPrice });
    booking.qrCode = await QRCode.toDataURL(qrData);
    await booking.save();

    trip.availableSeats -= passengers.length;
    await trip.save();

    const populated = await Booking.findById(booking._id).populate('trip').populate('couponApplied');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('trip')
      .populate('couponApplied')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('trip')
      .populate('user', '-password')
      .populate('couponApplied');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('trip', 'name location from to airline')
      .populate('user', 'name email')
      .populate('couponApplied', 'title discountValue discountType')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    booking.status = 'cancelled';
    booking.paymentStatus = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled', booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
