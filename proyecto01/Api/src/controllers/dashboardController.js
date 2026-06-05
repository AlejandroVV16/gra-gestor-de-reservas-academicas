const pool = require('../../DB/db');

const getSummary = async (req, res) => {
  try {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];

    const diaSemana = hoy.getDay();
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    lunes.setHours(0, 0, 0, 0);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const [
      reservasHoy,
      auditoriosOcupados,
      conflictos,
      eventosSemana,
      proximas,
      fechas
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM reservations
        WHERE event_start::date = $1
          AND status IN ('pendiente', 'aprobada')
      `, [hoyStr]),

      pool.query(`
        SELECT COUNT(DISTINCT auditorium_id)::int AS count
        FROM reservations
        WHERE event_start::date = $1
          AND status IN ('pendiente', 'aprobada')
      `, [hoyStr]),

      pool.query(`
        SELECT COUNT(*)::int AS count FROM (
          SELECT a.id FROM reservations a
          WHERE a.status = 'pendiente'
            AND EXISTS (
              SELECT 1 FROM reservations b
              WHERE b.auditorium_id = a.auditorium_id
                AND b.id != a.id
                AND b.status IN ('pendiente', 'aprobada')
                AND b.event_start < a.event_end
                AND b.event_end > a.event_start
            )
        ) AS sub
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM reservations
        WHERE event_start >= $1 AND event_start <= $2
          AND status IN ('pendiente', 'aprobada')
      `, [lunes.toISOString(), domingo.toISOString()]),

      pool.query(`
        SELECT
          r.id,
          TO_CHAR(r.event_start - INTERVAL '5 hours', 'HH24:MI') AS "horaInicio",
          r.event_name AS "evento",
          COALESCE(a.name, '—') AS "auditorio",
          r.status AS "estado"
        FROM reservations r
        LEFT JOIN auditoriums a ON a.id = r.auditorium_id
        WHERE r.event_start::date IN ($1, $2)
          AND r.status IN ('pendiente', 'aprobada')
        ORDER BY r.event_start
        LIMIT 6
      `, [hoyStr, mananaStr]),

      pool.query(`
        SELECT DISTINCT event_start::date AS fecha
        FROM reservations
        WHERE status IN ('pendiente', 'aprobada')
        ORDER BY fecha
      `),
    ]);

    res.json({
      reservasHoy: reservasHoy.rows[0].count,
      auditoriosOcupados: auditoriosOcupados.rows[0].count,
      conflictos: conflictos.rows[0].count,
      eventosSemana: eventosSemana.rows[0].count,
      proximas: proximas.rows,
      fechasConEventos: fechas.rows.map(r => {
        const d = new Date(r.fecha);
        return d.toISOString().split('T')[0];
      }),
    });
  } catch (error) {
    console.error('Error en dashboard summary:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getSummary };
