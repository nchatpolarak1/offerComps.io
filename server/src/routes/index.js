const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.get('/health', function (req, res) {
    res.json({ status: 'ok' });
});

router.post('/auth/register', authController.register);
router.post('/auth/login', rateLimitMiddleware.checkLoginAttempts, authController.login);
router.post('/auth/logout', authMiddleware.requireSession, authController.logout);
router.get('/auth/me', authMiddleware.requireSession, authController.me);

module.exports = router;
