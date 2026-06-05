const pool = require('../../DB/db');

const getSummary = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, auditorium_id, status } = req.query;
    const params = [];
    const conditions = [];

    conditions.push(`r.status != 'cancelada'`);

    if (fechaInicio) {
      params.push(fechaInicio);
      conditions.push(`r.event_start::date >= $${params.length}::date`);
    }
    if (fechaFin) {
      params.push(fechaFin);
      conditions.push(`r.event_start::date <= $${params.length}::date`);
    }
    if (auditorium_id) {
      params.push(auditorium_id);
      conditions.push(`r.auditorium_id = $${params.length}::uuid`);
    }
    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}::reservation_status`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const [countResult, auditoriosResult, datosResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM reservations r ${where}`, params),
      pool.query(`
        SELECT a.name AS auditorio, COUNT(*)::int AS count
        FROM reservations r
        JOIN auditoriums a ON a.id = r.auditorium_id
        ${where}
        GROUP BY a.name
        ORDER BY count DESC
      `, params),
      pool.query(`
        SELECT
          r.id,
          r.event_start,
          r.event_end,
          r.event_name,
          r.responsible_person,
          r.attendees_count,
          r.status,
          a.name AS auditorium_name
        FROM reservations r
        LEFT JOIN auditoriums a ON a.id = r.auditorium_id
        ${where}
        ORDER BY r.event_start DESC
      `, params),
    ]);

    const total = countResult.rows[0].total;
    const porAuditorio = auditoriosResult.rows;
    const auditorioTop = porAuditorio.length > 0 ? porAuditorio[0].auditorio : '—';

    res.json({
      total,
      auditorioTop,
      porAuditorio,
      datos: datosResult.rows,
    });
  } catch (error) {
    console.error('Error en reportes summary:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const exportCSV = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, auditorium_id, status } = req.query;
    const params = [];
    const conditions = [];

    conditions.push(`r.status != 'cancelada'`);

    if (fechaInicio) {
      params.push(fechaInicio);
      conditions.push(`r.event_start::date >= $${params.length}::date`);
    }
    if (fechaFin) {
      params.push(fechaFin);
      conditions.push(`r.event_start::date <= $${params.length}::date`);
    }
    if (auditorium_id) {
      params.push(auditorium_id);
      conditions.push(`r.auditorium_id = $${params.length}::uuid`);
    }
    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}::reservation_status`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await pool.query(`
      SELECT
        r.id,
        TO_CHAR(r.event_start AT TIME ZONE 'UTC' - INTERVAL '5 hours', 'YYYY-MM-DD') AS fecha,
        TO_CHAR(r.event_start AT TIME ZONE 'UTC' - INTERVAL '5 hours', 'HH24:MI') AS hora_inicio,
        TO_CHAR(r.event_end AT TIME ZONE 'UTC' - INTERVAL '5 hours', 'HH24:MI') AS hora_fin,
        r.responsible_person,
        r.event_name,
        r.attendees_count,
        r.status,
        a.name AS auditorium_name
      FROM reservations r
      LEFT JOIN auditoriums a ON a.id = r.auditorium_id
      ${where}
      ORDER BY r.event_start DESC
    `, params);

    const rows = result.rows;
    const header = 'id,fecha,hora_inicio,hora_fin,responsable,evento,asistentes,estado,auditorio';
    const csvLines = rows.map(r =>
      [
        r.id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        `"${(r.responsible_person || '').replace(/"/g, '""')}"`,
        `"${(r.event_name || '').replace(/"/g, '""')}"`,
        r.attendees_count,
        r.status,
        `"${(r.auditorium_name || '').replace(/"/g, '""')}"`,
      ].join(',')
    );

    const csv = [header, ...csvLines].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_reservas.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error en export CSV:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const clearReports = async (req, res) => {
  try {
    await pool.query('DELETE FROM reservation_history');
    await pool.query('DELETE FROM payments');
    await pool.query('UPDATE external_requests SET reservation_id = NULL');
    const result = await pool.query('DELETE FROM reservations');
    res.json({ message: `Datos eliminados — ${result.rowCount} reserva(s) eliminada(s)` });
  } catch (error) {
    console.error('Error al limpiar datos de reportes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getSummary, exportCSV, clearReports };
