const express = require('express');
const { getAllTrips, getTripById, createTrip, updateTrip, deleteTrip, getAllTripsAdmin } = require('../controllers/tripController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', getAllTrips);
router.get('/admin', protect, adminOnly, getAllTripsAdmin);
router.get('/:id', getTripById);

router.post('/', protect, adminOnly, upload.array('images', 4), createTrip);
router.put('/:id', protect, adminOnly, upload.array('images', 4), updateTrip);
router.delete('/:id', protect, adminOnly, deleteTrip);

module.exports = router;
