const express = require('express');
const router = express.Router();
const { getUsers, getPersonalTI, createUser, updateUser } = require('../controllers/usersController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/personal-ti', verifyToken, getPersonalTI);
router.get('/', verifyToken, getUsers);
router.post('/', verifyToken, createUser);
router.put('/:id', verifyToken, updateUser);

module.exports = router;
