const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, getActive } = require('../controllers/equipmentsController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/active', getActive);
router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, create);
router.put('/:id', verifyToken, update);

module.exports = router;
