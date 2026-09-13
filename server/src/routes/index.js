const express = require('express');
const authController = require('../controllers/authController');
const offerController = require('../controllers/offerController');
const cityController = require('../controllers/cityController');
const comparisonController = require('../controllers/comparisonController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// /api/health is registered in app.js, ahead of the database connect middleware,
// so that it still answers when one of the databases is down

router.post('/auth/register', authController.register);
router.post('/auth/login', rateLimitMiddleware.checkLoginAttempts, authController.login);
router.post('/auth/logout', authMiddleware.requireSession, authController.logout);
router.get('/auth/me', authMiddleware.requireSession, authController.me);

router.get('/cities', authMiddleware.requireSession, cityController.list);

router.get('/offers', authMiddleware.requireSession, offerController.list);
router.post('/offers', authMiddleware.requireSession, offerController.create);
router.get('/offers/:offerId', authMiddleware.requireSession, offerController.get);
router.get('/offers/:offerId/breakdown', authMiddleware.requireSession, offerController.breakdown);
router.put('/offers/:offerId', authMiddleware.requireSession, offerController.update);
router.delete('/offers/:offerId', authMiddleware.requireSession, offerController.remove);

router.get('/comparisons', authMiddleware.requireSession, comparisonController.list);
router.post('/comparisons', authMiddleware.requireSession, comparisonController.create);
router.get('/comparisons/:comparisonId', authMiddleware.requireSession, comparisonController.get);
router.get('/comparisons/:comparisonId/scores', authMiddleware.requireSession, comparisonController.scores);
router.get('/comparisons/:comparisonId/breakeven', authMiddleware.requireSession, comparisonController.breakEven);
router.put('/comparisons/:comparisonId', authMiddleware.requireSession, comparisonController.update);
router.delete('/comparisons/:comparisonId', authMiddleware.requireSession, comparisonController.remove);

module.exports = router;
