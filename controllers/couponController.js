const Coupon = require('../models/Coupon');
const CouponClaim = require('../models/CouponClaim');
const Booking = require('../models/Booking');
const User = require('../models/User');

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createCoupon = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const coupon = await Coupon.create(data);
    res.status(201).json(coupon);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin sends a coupon to a user
exports.sendCouponToUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const couponId = req.params.id;
    // User must have at least one booking
    const hasBooking = await Booking.findOne({ user: userId, paymentStatus: 'confirmed' });
    if (!hasBooking) return res.status(400).json({ message: 'User must have at least one booking to receive a coupon' });
    // Check if already sent
    const existing = await CouponClaim.findOne({ user: userId, coupon: couponId });
    if (existing) return res.status(400).json({ message: 'Coupon already sent to this user' });
    const claim = await CouponClaim.create({ user: userId, coupon: couponId, sentByAdmin: true });
    res.status(201).json(claim);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get user's coupons
exports.getMyCoupons = async (req, res) => {
  try {
    const claims = await CouponClaim.find({ user: req.user._id })
      .populate('coupon')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get all coupon claims (admin)
exports.getAllCouponClaims = async (req, res) => {
  try {
    const claims = await CouponClaim.find()
      .populate('user', 'name email')
      .populate('coupon', 'title code discountType discountValue')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
