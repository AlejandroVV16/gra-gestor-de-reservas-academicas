const express = require('express');
const router = express.Router();
const { getGlobalHistory, clearHistory } = require('../controllers/historyController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getGlobalHistory);
router.delete('/', verifyToken, requireAdmin, clearHistory);

module.exports = router;
