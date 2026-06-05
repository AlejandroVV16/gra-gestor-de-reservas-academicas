const express = require('express');
const router = express.Router();
const { getSummary, exportCSV, clearReports } = require('../controllers/reportsController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/summary', verifyToken, getSummary);
router.get('/export', verifyToken, exportCSV);
router.delete('/clear', verifyToken, clearReports);

module.exports = router;
