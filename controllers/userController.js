const User = require('../models/User');

const Booking = require('../models/Booking');

exports.getAllUsers = async (req, res) => {
  try {
    // Use aggregation to count bookings for each user
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'bookings',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$paymentStatus', 'confirmed'] }
                  ]
                }
              }
            },
            { $count: 'confirmedCount' }
          ],
          as: 'bookingInfo'
        }
      },
      {
        $addFields: {
          bookingCount: { $ifNull: [{ $arrayElemAt: ['$bookingInfo.confirmedCount', 0] }, 0] }
        }
      },
      { $project: { password: 0, bookingInfo: 0 } },
      { $sort: { createdAt: -1 } }
    ]);
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot modify admin account' });
    user.role = req.body.role || user.role;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin account' });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
