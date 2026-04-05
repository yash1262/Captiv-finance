const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

console.log('Auth routes module loaded');

router.post('/register', register);
router.post('/login', login);

console.log('Auth routes registered: POST /register, POST /login');

module.exports = router;
