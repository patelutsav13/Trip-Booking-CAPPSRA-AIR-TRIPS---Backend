const express = require('express');
const { getAllUsers, getUserById, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect, adminOnly);
router.route('/').get(getAllUsers);
router.route('/:id').get(getUserById).put(updateUserRole).delete(deleteUser);

module.exports = router;
