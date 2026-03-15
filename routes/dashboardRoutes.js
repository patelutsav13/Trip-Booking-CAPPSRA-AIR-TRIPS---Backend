const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', protect, adminOnly, getDashboardStats);

module.exports = router;
