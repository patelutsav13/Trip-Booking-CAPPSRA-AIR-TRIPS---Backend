const User = require('../models/User');
const Coupon = require('../models/Coupon');
const CouponClaim = require('../models/CouponClaim');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendResetPasswordEmail } = require('../utils/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

// Helper to assign 3 initial free coupons and send welcome email (non-blocking)
const assignInitialFreeCoupons = async (user) => {
  try {
    const existingClaimsCount = await CouponClaim.countDocuments({ user: user._id });
    if (existingClaimsCount > 0) return []; // Already initialized

    let initialCoupons = await Coupon.find({ isActive: true }).limit(3);
    if (initialCoupons.length < 3) {
      initialCoupons = await Coupon.find().limit(3);
    }

    const assignedCoupons = [];
    for (const coupon of initialCoupons) {
      await CouponClaim.create({
        user: user._id,
        coupon: coupon._id,
        claimSource: 'signup',
        sentByAdmin: true,
        isClaimed: false, // Available & Active in Locker!
        usedInBooking: null,
        claimedAt: new Date()
      });
      assignedCoupons.push(coupon);
    }

    // Fire & Forget email dispatch
    sendWelcomeEmail(user, assignedCoupons).catch(err => console.error('Background welcome email error:', err));
    return assignedCoupons;
  } catch (err) {
    console.error('Error assigning initial coupons:', err);
    return [];
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists with this email address' });

    const user = await User.create({ name, email: email.toLowerCase(), password, phone });
    await assignInitialFreeCoupons(user);

    const token = generateToken(user._id);
    res.status(201).json({
      token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const claimsCount = await CouponClaim.countDocuments({ user: user._id });
    if (claimsCount === 0) {
      await assignInitialFreeCoupons(user);
    }

    const token = generateToken(user._id);
    res.json({
      token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Google OAuth Login / Continue with Google
exports.googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;
    if (!email) return res.status(400).json({ message: 'Google email is required' });

    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: randomPassword,
        googleId: googleId || `google_${Date.now()}`,
        avatar: avatar || ''
      });
    } else if (!user.googleId) {
      user.googleId = googleId || `google_${Date.now()}`;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
    }

    const claimsCount = await CouponClaim.countDocuments({ user: user._id });
    if (isNewUser || claimsCount === 0) {
      await assignInitialFreeCoupons(user);
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Forgot Password - Send Reset Email Link
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email address' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // Valid 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    sendResetPasswordEmail(user, resetUrl).catch(err => console.error('Background reset email error:', err));

    res.json({
      message: 'Password reset link has been sent to your email address.',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset Password - Update Password with Token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = '';
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ message: 'Password updated successfully! You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, city, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.city = city || user.city;
    user.country = country || user.country;
    if (req.file) user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar, city: user.city, country: user.country });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
