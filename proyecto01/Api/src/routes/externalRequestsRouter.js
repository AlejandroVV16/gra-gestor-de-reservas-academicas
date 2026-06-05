const express = require('express');
const router = express.Router();
const {
    createFromForm, list, getOne,
    approve, reject, registerPayment, cancel
} = require('../controllers/externalRequestController');

router.get('/', list);
router.get('/:id', getOne);
router.post('/', createFromForm);
router.patch('/:id/aprobar', approve);
router.patch('/:id/rechazar', reject);
router.patch('/:id/cancelar', cancel);
router.patch('/:id/pago', registerPayment);

module.exports = router;
