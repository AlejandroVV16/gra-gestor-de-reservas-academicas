const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'ruts');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto.randomUUID();
        cb(null, `${uniqueSuffix}.pdf`);
    },
});

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Solo se permiten archivos PDF'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const {
    createFromForm, list, getOne,
    approve, approveFree, reject, registerPayment, cancel
} = require('../controllers/externalRequestController');

router.get('/', list);
router.get('/:id', getOne);
router.post('/', upload.single('archivoRut'), (req, res, next) => {
    req.body.archivoRutPath = req.file ? req.file.path : null;
    next();
}, createFromForm);
router.patch('/:id/aprobar', approve);
router.patch('/:id/aprobar-gratis', approveFree);
router.patch('/:id/rechazar', reject);
router.patch('/:id/cancelar', cancel);
router.patch('/:id/pago', registerPayment);

module.exports = router;
