const express = require('express');
const router = express.Router();
const {
    getauditoriums,
    getActiveauditoriums,
    getAuditoriumById,
    createAuditorium,
    updateAuditorium,
    checkAvailability,
    getDaySchedule
} = require('../controllers/auditoriumsController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getauditoriums);
router.get('/active', getActiveauditoriums);
router.get('/:id/availability', checkAvailability);
router.get('/:id/schedule', getDaySchedule);
router.get('/:id', getAuditoriumById);
router.post('/', verifyToken, createAuditorium);
router.put('/:id', verifyToken, updateAuditorium);

module.exports = router;