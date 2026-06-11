const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ error: 'Token no proporcionado' });

    const token = authHeader.split(' ')[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.user_type !== 'admin')
        return res.status(403).json({ error: 'Acción permitida solo para administradores' });
    next();
};

module.exports = { verifyToken, requireAdmin };