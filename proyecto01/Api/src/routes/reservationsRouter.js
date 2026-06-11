const express = require('express');
const router = express.Router();
const {
    getReservations,
    getReservationById,
    updateReservation,
    cancelReservation,
    createReservation,
    getReservationHistory
} = require('../controllers/reservationsController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getReservations);
router.get('/:id/history', verifyToken, getReservationHistory);
router.get('/:id', verifyToken, getReservationById);
router.put('/:id', verifyToken, updateReservation);
router.patch('/:id/cancel', verifyToken, cancelReservation);

router.post('/', verifyToken, createReservation);

module.exports = router;