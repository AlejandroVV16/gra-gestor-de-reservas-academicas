const pool = require('../../DB/db');

const getGlobalHistory = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, usuario, accion, auditorio } = req.query;
    const params = [];
    const conditions = [];

    if (fechaInicio) {
      params.push(fechaInicio);
      conditions.push(`rh.fecha >= $${params.length}::date`);
    }
    if (fechaFin) {
      params.push(fechaFin);
      conditions.push(`rh.fecha <= $${params.length}::date + INTERVAL '1 day'`);
    }
    if (usuario) {
      params.push(`%${usuario}%`);
      conditions.push(`rh.usuario ILIKE $${params.length}`);
    }
    if (accion) {
      params.push(accion);
      conditions.push(`rh.accion = $${params.length}`);
    }
    if (auditorio) {
      params.push(`%${auditorio}%`);
      conditions.push(`a.name ILIKE $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT
        rh.id,
        rh.fecha                          AS "fechaHora",
        rh.reservation_id                 AS "reservaId",
        COALESCE(r.event_name, '—')       AS "reservaNombre",
        COALESCE(a.name, '—')             AS "auditorio",
        rh.accion                         AS "tipoAccion",
        rh.usuario,
        rh.descripcion
      FROM reservation_history rh
      LEFT JOIN reservations r  ON r.id = rh.reservation_id
      LEFT JOIN auditoriums a   ON a.id = r.auditorium_id
      ${where}
      ORDER BY rh.fecha DESC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener historial global:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const clearHistory = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservation_history');
    res.json({ message: `Historial limpiado — ${result.rowCount} registro(s) eliminado(s)` });
  } catch (error) {
    console.error('Error al limpiar historial:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { getGlobalHistory, clearHistory };
