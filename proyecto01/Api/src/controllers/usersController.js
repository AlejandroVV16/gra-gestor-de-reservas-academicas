const pool = require('../../DB/db');
const bcrypt = require('bcryptjs');

const ROL_MAP = { ADMINISTRADOR: 'admin', PERSONAL_TI: 'interno' };
const ROL_MAP_REV = { admin: 'ADMINISTRADOR', interno: 'PERSONAL_TI' };

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_type, full_name, email, correo, phone, is_active, last_login, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const getPersonalTI = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email
      FROM users
      WHERE user_type = 'interno' AND is_active = TRUE
      ORDER BY full_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const createUser = async (req, res) => {
  const { nombre, apellido, correo, usuario, contrasena, rol, estado } = req.body;

  if (!nombre || !apellido || !usuario || !contrasena || !rol) {
    return res.status(400).json({ error: 'nombre, apellido, usuario, contrasena y rol son requeridos' });
  }

  const userType = ROL_MAP[rol];
  if (!userType) {
    return res.status(400).json({ error: `Rol inválido: ${rol}` });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [usuario]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El usuario institucional ya existe' });
    }

    const fullName = `${nombre} ${apellido}`.trim();
    const passwordHash = await bcrypt.hash(contrasena, 10);

    const result = await pool.query(`
      INSERT INTO users (user_type, full_name, email, correo, password_hash, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_type, full_name, email, correo, phone, is_active, last_login, created_at, updated_at
    `, [userType, fullName, usuario, correo || null, passwordHash, estado !== 'INACTIVO']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const updateUser = async (req, res) => {
  const { nombre, apellido, correo, usuario, contrasena, rol, estado } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = existing.rows[0];
    const fullName = (nombre || apellido)
      ? `${nombre || user.full_name.split(' ')[0]} ${apellido || user.full_name.split(' ').slice(1).join(' ')}`.trim()
      : user.full_name;
    const userType = rol ? ROL_MAP[rol] : user.user_type;

    if (rol && !userType) {
      return res.status(400).json({ error: `Rol inválido: ${rol}` });
    }

    let passwordHash = user.password_hash;
    if (contrasena && contrasena.trim()) {
      passwordHash = await bcrypt.hash(contrasena, 10);
    }

    const result = await pool.query(`
      UPDATE users SET
        full_name = $1,
        email = COALESCE($2, email),
        correo = COALESCE($3, correo),
        user_type = $4,
        password_hash = $5,
        is_active = COALESCE($6, is_active)
      WHERE id = $7
      RETURNING id, user_type, full_name, email, correo, phone, is_active, last_login, created_at, updated_at
    `, [
      fullName,
      usuario || user.email,
      correo || user.correo,
      userType,
      passwordHash,
      estado !== undefined ? estado === 'ACTIVO' : user.is_active,
      req.params.id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getUsers, getPersonalTI, createUser, updateUser };
