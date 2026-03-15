const express = require('express');
const { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, sendCouponToUser, getMyCoupons, getAllCouponClaims } = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.use(protect);

// User routes
router.get('/mycoupons', getMyCoupons);

// Admin routes
router.use(adminOnly);
router.route('/').get(getAllCoupons).post(upload.single('image'), createCoupon);
router.route('/:id').put(updateCoupon).delete(deleteCoupon);

router.get('/claims/all', getAllCouponClaims);
router.post('/:id/send', sendCouponToUser);

module.exports = router;
