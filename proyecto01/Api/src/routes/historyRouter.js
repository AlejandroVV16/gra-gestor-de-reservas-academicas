const express = require('express');
const router = express.Router();
const { getGlobalHistory, clearHistory } = require('../controllers/historyController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getGlobalHistory);
router.delete('/', verifyToken, clearHistory);

module.exports = router;
