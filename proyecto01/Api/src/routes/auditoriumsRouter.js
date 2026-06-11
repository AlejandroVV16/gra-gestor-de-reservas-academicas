const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function slugify(text) {
  const acentos = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n','Á':'a','É':'e','Í':'i','Ó':'o','Ú':'u','Ü':'u','Ñ':'n' };
  return text
    .toLowerCase()
    .replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, ch => acentos[ch] || ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'auditorios');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const name = req.body?.name || path.basename(file.originalname, path.extname(file.originalname));
        const ext = path.extname(file.originalname);
        cb(null, `${slugify(name)}${ext}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

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
router.post('/', verifyToken, upload.single('image'), createAuditorium);
router.put('/:id', verifyToken, upload.single('image'), updateAuditorium);

module.exports = router;
