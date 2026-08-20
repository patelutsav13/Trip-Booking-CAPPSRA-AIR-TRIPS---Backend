const Coupon = require('../models/Coupon');
const CouponClaim = require('../models/CouponClaim');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendFestivalBonusEmail, sendSubscriptionEmail } = require('../utils/emailService');

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().lean().sort({ createdAt: -1 });
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
    const hasBooking = await Booking.findOne({ user: userId, paymentStatus: 'confirmed' });
    if (!hasBooking) return res.status(400).json({ message: 'User must have at least one booking to receive a coupon' });
    
    const existing = await CouponClaim.findOne({ user: userId, coupon: couponId });
    if (existing) return res.status(400).json({ message: 'Coupon already sent to this user' });
    const claim = await CouponClaim.create({ user: userId, coupon: couponId, sentByAdmin: true, claimSource: 'admin', isClaimed: false, usedInBooking: null });
    res.status(201).json(claim);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get user's coupons
exports.getMyCoupons = async (req, res) => {
  try {
    const claims = await CouponClaim.find({ user: req.user._id })
      .populate('coupon')
      .lean()
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
      .lean()
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Claim / Check Festival & Vacation Bonus Coupons (Diwali, Winter/New Year, Summer)
exports.checkAndAwardFestivalBonus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const { festivalType } = req.body;

    const activeUserClaims = await CouponClaim.find({
      user: userId,
      usedInBooking: null
    }).populate('coupon');

    const unusedCouponIds = new Set(activeUserClaims.map(c => c.coupon?._id.toString()));

    const currentYear = new Date().getFullYear();
    let selectedFestival = festivalType || 'diwali';
    let claimSourceKey = `festival_${selectedFestival}`;

    const startOfYear = new Date(currentYear, 0, 1);
    const alreadyClaimedFestivalThisYear = await CouponClaim.findOne({
      user: userId,
      claimSource: claimSourceKey,
      createdAt: { $gte: startOfYear }
    });

    if (alreadyClaimedFestivalThisYear) {
      return res.status(400).json({
        message: `You have already claimed your ${selectedFestival.toUpperCase()} bonus coupons for ${currentYear}. Use your current coupons to qualify for future bonuses!`
      });
    }

    const allCoupons = await Coupon.find({ isActive: true });
    let availableForUser = allCoupons.filter(c => !unusedCouponIds.has(c._id.toString()));

    if (availableForUser.length < 2) {
      availableForUser.push(...allCoupons);
    }

    const shuffled = [...availableForUser].sort(() => 0.5 - Math.random());
    const awardedCoupons = [];
    const uniqueIds = new Set();

    for (const coupon of shuffled) {
      if (uniqueIds.has(coupon._id.toString())) continue;
      uniqueIds.add(coupon._id.toString());
      
      await CouponClaim.create({
        user: userId,
        coupon: coupon._id,
        claimSource: claimSourceKey,
        isClaimed: false, // Active & ready to use!
        usedInBooking: null,
        claimedAt: new Date()
      });
      awardedCoupons.push(coupon);
      if (awardedCoupons.length >= 2) break;
    }

    const festivalNamesMap = {
      diwali: 'Diwali Festival',
      winter: 'Winter Vacation / New Year',
      summer: 'Summer Vacation'
    };
    const festivalDisplayName = festivalNamesMap[selectedFestival] || 'Vacation Bonus';
    
    sendFestivalBonusEmail(user, festivalDisplayName, awardedCoupons).catch(err => console.error('Background festival email error:', err));

    res.json({
      message: `🎉 Congratulations! 2 ${festivalDisplayName} Bonus Coupons awarded!`,
      coupons: awardedCoupons
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Subscribe to Coupon Package (6-Month ₹5000 / Yearly ₹8000)
exports.subscribeCouponPackage = async (req, res) => {
  try {
    const { packageType, paymentMethod } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const is6Month = packageType === '6months';
    const amount = is6Month ? 5000 : 8000;
    const countNeeded = is6Month ? 5 : 8;
    const subscriptionTitle = is6Month ? '6-Month Trip Coupon Subscription Package (₹5000)' : 'Yearly Trip Coupon Subscription Package (₹8000)';
    const sourceKey = is6Month ? 'subscription_6m' : 'subscription_1y';

    const targetCodes6M = ['SAVE10', 'SAVE20', 'SAVE30', 'FREEFOOD', 'FREEHOTEL'];
    const targetCodes1Y = ['SAVE10', 'SAVE20', 'SAVE30', 'HALFPRICE', 'FREEFOOD', 'FREEHOTEL', 'FREETRANS', 'FREEBKFST'];
    const targetCodes = is6Month ? targetCodes6M : targetCodes1Y;

    let coupons = await Coupon.find({ code: { $in: targetCodes } });
    if (coupons.length < countNeeded) {
      const remainingCoupons = await Coupon.find({ _id: { $nin: coupons.map(c => c._id) } }).limit(countNeeded - coupons.length);
      coupons = [...coupons, ...remainingCoupons];
    }

    const awardedCoupons = [];
    for (const coupon of coupons) {
      await CouponClaim.create({
        user: userId,
        coupon: coupon._id,
        claimSource: sourceKey,
        isClaimed: false, // Active & ready to use!
        usedInBooking: null,
        claimedAt: new Date()
      });
      awardedCoupons.push(coupon);
    }

    sendSubscriptionEmail(user, subscriptionTitle, amount, awardedCoupons).catch(err => console.error('Background subscription email error:', err));

    res.json({
      success: true,
      message: `🎉 Successfully subscribed to ${subscriptionTitle}! ${awardedCoupons.length} coupons added to your profile. Confirmation email sent to ${user.email}.`,
      subscription: {
        packageType,
        amount,
        paymentMethod: paymentMethod || 'Online Payment',
        validity: is6Month ? '6 Months' : '1 Year',
        coupons: awardedCoupons
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
