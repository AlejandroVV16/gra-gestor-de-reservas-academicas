const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../../DB/db');

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: 'Email y contraseña requeridos' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user)
            return res.status(401).json({ error: 'Credenciales inválidas' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Credenciales inválidas' });

        if (user.user_type === 'interno') {
            return res.status(403).json({
                error: 'Los usuarios de facultad deben realizar su solicitud a través del formulario público de solicitud externa'
            });
        }

        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        const token = jwt.sign(
            { id: user.id, user_type: user.user_type, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user_id: user.id, user_type: user.user_type, full_name: user.full_name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { login };