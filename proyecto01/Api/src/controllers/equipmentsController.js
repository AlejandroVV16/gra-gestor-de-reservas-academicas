const pool = require('../../DB/db');

const getAll = async (req, res) => {
  try {
    const { incluirInactivos } = req.query;
    const sql = incluirInactivos === 'true'
      ? 'SELECT * FROM equipments ORDER BY name'
      : 'SELECT * FROM equipments WHERE is_active = TRUE ORDER BY name';
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM equipments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const create = async (req, res) => {
  const { name, quantity, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del equipo es requerido' });
  }
  if (quantity != null && (isNaN(quantity) || Number(quantity) < 0)) {
    return res.status(400).json({ error: 'La cantidad debe ser un número válido mayor o igual a 0' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO equipments (name, quantity, description, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING *
    `, [name.trim(), quantity != null ? Number(quantity) : 0, description || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un equipo con ese nombre' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const update = async (req, res) => {
  const { name, quantity, description, is_active } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM equipments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    const result = await pool.query(`
      UPDATE equipments SET
        name = COALESCE($1, name),
        quantity = COALESCE($2, quantity),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *
    `, [
      name ? name.trim() : null,
      quantity != null ? Number(quantity) : null,
      description !== undefined ? description : null,
      is_active !== undefined ? is_active : null,
      req.params.id
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un equipo con ese nombre' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const getActive = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipments WHERE is_active = TRUE ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getAll, getById, create, update, getActive };
