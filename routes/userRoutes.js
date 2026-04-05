const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, toggleUserStatus } = require('../controllers/userController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Only Admin can manage users
router.get('/', authenticateToken, checkRole(['Admin']), getAllUsers);
router.put('/:userId/role', authenticateToken, checkRole(['Admin']), updateUserRole);
router.put('/:userId/status', authenticateToken, checkRole(['Admin']), toggleUserStatus);

module.exports = router;
