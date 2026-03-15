const User = require('../models/User');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const CouponClaim = require('../models/CouponClaim');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTrips = await Trip.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } }
    ]);
    const activeCoupons = await CouponClaim.countDocuments({ isClaimed: false });

    // Monthly bookings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Popular trips
    const popularTrips = await Booking.aggregate([
      { $group: { _id: '$trip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'trips', localField: '_id', foreignField: '_id', as: 'trip' } },
      { $unwind: '$trip' },
      { $project: { tripName: '$trip.name', count: 1, location: '$trip.location' } }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('trip', 'name location')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalTrips,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeCoupons,
      monthlyBookings,
      popularTrips,
      recentBookings,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
