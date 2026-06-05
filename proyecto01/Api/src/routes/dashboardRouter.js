const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/summary', verifyToken, getSummary);

module.exports = router;
