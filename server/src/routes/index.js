const express = require('express');
const authController = require('../controllers/authController');
const offerController = require('../controllers/offerController');
const cityController = require('../controllers/cityController');
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

router.get('/cities', authMiddleware.requireSession, cityController.list);

router.get('/offers', authMiddleware.requireSession, offerController.list);
router.post('/offers', authMiddleware.requireSession, offerController.create);
router.get('/offers/:offerId', authMiddleware.requireSession, offerController.get);

module.exports = router;
