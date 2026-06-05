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
const { requestExternal, upload } = require('../controllers/externalRequestController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getReservations);
router.get('/:id/history', verifyToken, getReservationHistory);
router.get('/:id', verifyToken, getReservationById);
router.put('/:id', verifyToken, updateReservation);
router.patch('/:id/cancel', verifyToken, cancelReservation);

router.post('/', (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return verifyToken(req, res, next);
    }

    upload.single('rut_file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        req.isExternal = true;
        next();
    });
}, (req, res) => {
    if (req.isExternal) return requestExternal(req, res);
    return createReservation(req, res);
});

module.exports = router;