const express = require('express');
const { createBooking, getMyBookings, getBookingById, getAllBookings, cancelBooking } = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/').post(createBooking).get(adminOnly, getAllBookings);
router.get('/mybookings', getMyBookings);
router.route('/:id').get(getBookingById);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
