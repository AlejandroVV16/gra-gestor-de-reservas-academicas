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

// ── Helper: insertar entrada en el historial ───────────────────────────────
const addHistory = async (reservationId, accion, usuario, descripcion) => {
  await pool.query(`
    INSERT INTO reservation_history (reservation_id, accion, usuario, descripcion)
    VALUES ($1, $2, $3, $4)
  `, [reservationId, accion, usuario, descripcion]);
};

const getReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, fecha, auditorium_id, status, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (fecha) {
      params.push(fecha);
      conditions.push(`r.request_date = $${params.length}::date`);
    }
    if (auditorium_id) {
      params.push(auditorium_id);
      conditions.push(`r.auditorium_id = $${params.length}::uuid`);
    }
    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}::reservation_status`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(r.event_name ILIKE $${params.length} OR r.responsible_person ILIKE $${params.length})`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM reservations r ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit);
    params.push(offset);
    const result = await pool.query(`
      SELECT r.*, a.name AS auditorium_name, a.location
      FROM reservations r
      LEFT JOIN auditoriums a ON a.id = r.auditorium_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      data: result.rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const getReservationById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.name AS auditorium_name, a.location
      FROM reservations r
      LEFT JOIN auditoriums a ON a.id = r.auditorium_id
      WHERE r.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const updateReservation = async (req, res) => {
  try {
    const { event_name, attendees_count, responsible_person, event_start, event_end, notes } = req.body;

    const existing = await pool.query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const ant = existing.rows[0];
    const cambios = [];
    if (event_name && event_name !== ant.event_name) cambios.push(`nombre: "${ant.event_name}" → "${event_name}"`);
    if (attendees_count && Number(attendees_count) !== ant.attendees_count) cambios.push(`asistentes: ${ant.attendees_count} → ${attendees_count}`);
    if (event_start) cambios.push('horario modificado');

    const result = await pool.query(`
      UPDATE reservations SET
        event_name = COALESCE($1, event_name),
        attendees_count = COALESCE($2, attendees_count),
        responsible_person = COALESCE($3, responsible_person),
        event_start = COALESCE($4, event_start),
        event_end = COALESCE($5, event_end),
        notes = COALESCE($6, notes)
      WHERE id = $7
      RETURNING *
    `, [event_name, attendees_count, responsible_person, event_start, event_end, notes, req.params.id]);

    await addHistory(req.params.id, 'EDITADA', req.user.full_name || req.user.email, cambios.join('; ') || 'Reserva actualizada');

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE reservations SET status = 'cancelada'
      WHERE id = $1 AND status NOT IN ('cancelada')
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o ya cancelada' });
    }

    await addHistory(req.params.id, 'CANCELADA', req.user.full_name || req.user.email, 'Reserva cancelada por el administrador');

    res.json({ message: 'Reserva cancelada', reservation: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const createReservation = async (req, res) => {
    const b = req.body;

    // Acepta tanto nombres del backend como del frontend
    const auditoriumId   = b.auditorium_id || b.auditorioId;
    const eventName      = b.event_name    || b.nombreEvento;
    const attendeesCount = b.attendees_count || b.personas;
    const responsible    = b.responsible_person || b.encargado;
    const applicantName  = b.applicant_name || req.user?.full_name || req.user?.email;
    const applicantPhone = b.applicant_phone || '';
    let eventStart = b.event_start;
    let eventEnd   = b.event_end;

    if (!eventStart && b.fecha && b.horaInicio) {
        eventStart = `${b.fecha}T${b.horaInicio}:00.000-05:00`;
    }
    if (!eventEnd && b.fecha && b.horaFin) {
        eventEnd = `${b.fecha}T${b.horaFin}:00.000-05:00`;
    }

    // 1. Validar campos requeridos
    if (!auditoriumId || !eventName || !attendeesCount || !responsible ||
        !eventStart || !eventEnd) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const start = new Date(eventStart);
    const end = new Date(eventEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Fecha/hora inválida' });
    }

    // 2. Validar que event_end > event_start
    if (end <= start) {
        return res.status(400).json({ error: 'La fecha de fin debe ser mayor a la de inicio' });
    }

    // 3. Validar que sean exactamente 4 o 6 horas
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours !== 4 && diffHours !== 6) {
        return res.status(400).json({ error: 'La duración debe ser exactamente 4 o 6 horas' });
    }

    // 4. Validar horario permitido (6am - 11pm hora Colombia UTC-5)
    const OFFSET_MINUTES = 300;
    const MIN_START_MINUTES = 6 * 60;
    const MAX_END_MINUTES = 23 * 60;

    const toColombiaMinutes = (date) => {
        const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
        return ((utcMinutes - OFFSET_MINUTES) % 1440 + 1440) % 1440;
    };

    const startMinutesCol = toColombiaMinutes(start);
    const endMinutesCol = toColombiaMinutes(end);

    if (startMinutesCol < MIN_START_MINUTES) {
        return res.status(400).json({ error: 'El evento no puede iniciar antes de las 6:00am' });
    }

    if (endMinutesCol <= startMinutesCol || endMinutesCol > MAX_END_MINUTES) {
        return res.status(400).json({ error: 'El evento no puede terminar después de las 11:00pm' });
    }

    try {
        // 5. Resolver user_id real desde la BD (el token puede tener UUID obsoleto)
        let userId = req.user.id;
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
        } else {
            const anyUser = await pool.query('SELECT id FROM users LIMIT 1');
            if (anyUser.rows.length > 0) userId = anyUser.rows[0].id;
        }

        // 6. Resolver auditorium_id (numérico → UUID)
        const resolvedId = await resolveAuditoriumId(auditoriumId);

        const auditorium = await pool.query(
            'SELECT id FROM auditoriums WHERE id = $1 AND is_active = TRUE',
            [resolvedId]
        );
        if (auditorium.rows.length === 0) {
            return res.status(404).json({ error: 'Auditorio no encontrado o inactivo' });
        }

        // 7. Verificar cruce de horarios
        const conflict = await pool.query(`
            SELECT id FROM reservations
            WHERE auditorium_id = $1
              AND status IN ('pendiente', 'aprobada')
              AND event_start < $3
              AND event_end   > $2
        `, [resolvedId, start, end]);

        if (conflict.rows.length > 0) {
            return res.status(409).json({ error: 'El horario solicitado se cruza con una reserva existente' });
        }

        // 8. Crear la reserva
        const result = await pool.query(`
            INSERT INTO reservations (
                user_id, auditorium_id, event_name, attendees_count,
                responsible_person, applicant_name, applicant_phone,
                event_start, event_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            userId,
            resolvedId,
            eventName,
            parseInt(attendeesCount),
            responsible,
            applicantName,
            applicantPhone,
            start,
            end
        ]);

        await addHistory(result.rows[0].id, 'CREADA', req.user.full_name || req.user.email, `Reserva creada para "${eventName}" en el auditorio`);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const getReservationHistory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, accion, usuario, descripcion, fecha
      FROM reservation_history
      WHERE reservation_id = $1
      ORDER BY fecha DESC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getReservations, getReservationById, updateReservation, cancelReservation, createReservation, getReservationHistory };