// src/controllers/auditoriumsController.js
const pool = require('../../DB/db');

// ── Helper: resolver ID numérico (frontend mock) a UUID de la BD ───────
const AUDITORIUM_NAME_MAP = {
  1: 'Benjamín Herrera',
  2: 'Rodrigo Rivera',
  3: 'Sala Auxiliar 1',
  4: 'Sala de Sistemas 1',
};

async function resolveAuditoriumId(param) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(param)) return param;

  const nombre = AUDITORIUM_NAME_MAP[param];
  if (nombre) {
    const palabras = nombre.split(/\s+/).filter(w => w.length > 2).slice(0, 2);
    const pattern = '%' + palabras.join('%') + '%';
    const result = await pool.query(
      'SELECT id FROM auditoriums WHERE name ILIKE $1 LIMIT 1',
      [pattern]
    );
    if (result.rows.length > 0) return result.rows[0].id;
  }

  const fallback = await pool.query(
    'SELECT id FROM auditoriums WHERE is_active = TRUE LIMIT 1'
  );
  if (fallback.rows.length > 0) return fallback.rows[0].id;

  return param;
}

const getauditoriums = async (req, res) => {
    try {
        const { incluirInactivos } = req.query;
        const sql = incluirInactivos === 'true'
            ? 'SELECT * FROM auditoriums'
            : 'SELECT * FROM auditoriums WHERE is_active = TRUE';
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const getActiveauditoriums = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM auditoriums WHERE is_active = TRUE');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const getAuditoriumById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM auditoriums WHERE id = $1', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const createAuditorium = async (req, res) => {
    const { name, location, capacity, description } = req.body;

    if (!name || !location || !capacity) {
        return res.status(400).json({ error: 'Nombre, sede y capacidad son requeridos' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO auditoriums (name, location, capacity, description, is_active)
            VALUES ($1, $2, $3, $4, TRUE)
            RETURNING *
        `, [name, location, capacity, description || null]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const updateAuditorium = async (req, res) => {
    const { name, location, capacity, description, is_active } = req.body;

    try {
        const existing = await pool.query('SELECT * FROM auditoriums WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Auditorio no encontrado' });
        }

        const result = await pool.query(`
            UPDATE auditoriums SET
                name = COALESCE($1, name),
                location = COALESCE($2, location),
                capacity = COALESCE($3, capacity),
                description = COALESCE($4, description),
                is_active = COALESCE($5, is_active)
            WHERE id = $6
            RETURNING *
        `, [name, location, capacity, description, is_active, req.params.id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Helper: convertir timestamp a hora Colombia (UTC-5) en formato HH:MM
const formatColombiaTime = (ts) => {
  const d = new Date(ts);
  const col = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  const h = String(col.getUTCHours()).padStart(2, '0');
  const m = String(col.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const getDaySchedule = async (req, res) => {
  try {
    const id = await resolveAuditoriumId(req.params.id);
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'fecha es requerida (YYYY-MM-DD)' });
    }

    const auditorium = await pool.query(
      'SELECT id, name FROM auditoriums WHERE id = $1', [id]
    );
    if (auditorium.rows.length === 0) {
      return res.status(404).json({ error: 'Auditorio no encontrado' });
    }

    const dayStart = `${fecha}T00:00:00-05:00`;
    const dayEnd = `${fecha}T23:59:59-05:00`;

    const result = await pool.query(`
      SELECT r.id, r.event_name, r.event_start, r.event_end, r.status
      FROM reservations r
      WHERE r.auditorium_id = $1
        AND r.status IN ('pendiente', 'aprobada')
        AND r.event_start < $3
        AND r.event_end   > $2
      ORDER BY r.event_start
    `, [id, dayStart, dayEnd]);

    res.json({
      fecha,
      auditorio_id: id,
      horario_operacion: { inicio: '06:00', fin: '23:00' },
      bloques_ocupados: result.rows.map((r) => ({
        id: r.id,
        evento: r.event_name,
        hora_inicio: formatColombiaTime(r.event_start),
        hora_fin: formatColombiaTime(r.event_end),
        estado: r.status,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const id = await resolveAuditoriumId(req.params.id);
    const { fecha, hora_inicio, hora_fin } = req.query;

    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'fecha, hora_inicio y hora_fin son requeridos' });
    }

    // Construir timestamps en hora Colombia (UTC-5)
    const eventStart = new Date(`${fecha}T${hora_inicio}:00-05:00`);
    const eventEnd   = new Date(`${fecha}T${hora_fin}:00-05:00`);

    if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
      return res.status(400).json({ error: 'Fecha u hora inválida' });
    }

    if (eventEnd <= eventStart) {
      return res.status(400).json({ error: 'hora_fin debe ser mayor a hora_inicio' });
    }

    // Verificar si el auditorio existe
    const auditorium = await pool.query(
      'SELECT id, name FROM auditoriums WHERE id = $1', [id]
    );
    if (auditorium.rows.length === 0) {
      return res.status(404).json({ error: 'Auditorio no encontrado' });
    }

    // Buscar reservas que se crucen en el horario solicitado
    const conflictResult = await pool.query(`
      SELECT
        r.id,
        r.event_name,
        r.event_start,
        r.event_end,
        r.status,
        r.responsible_person
      FROM reservations r
      WHERE r.auditorium_id = $1
        AND r.status IN ('pendiente', 'aprobada')
        AND r.event_start < $3
        AND r.event_end   > $2
      ORDER BY r.event_start
    `, [id, eventStart, eventEnd]);

    res.json({
      disponible: conflictResult.rows.length === 0,
      conflictos: conflictResult.rows.map((c) => ({
        id: c.id,
        evento: c.event_name,
        inicio: c.event_start,
        fin: c.event_end,
        estado: c.status,
        responsable: c.responsible_person,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getauditoriums, getActiveauditoriums, getAuditoriumById, createAuditorium, updateAuditorium, checkAvailability, getDaySchedule };