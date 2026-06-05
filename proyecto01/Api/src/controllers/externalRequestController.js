const pool = require('../../DB/db');

// ── Helper: convertir tipo del frontend al enum de la BD ─────────────────
function getExternalType(tipo) {
  if (tipo === 'Colegio público / Jardín público') return 'escuela_publica';
  if (tipo === 'Colegio privado / Jardín privado') return 'escuela_privada';
  return 'general';
}

// ── Endpoint público: crear solicitud externa desde el formulario ─────────
//    Guarda en external_requests (NO en reservations directamente).
//    Un admin debe aprobar la solicitud para que se cree la reserva.
const createFromForm = async (req, res) => {
    const {
        nombreEntidad, tipoEntidad, nit,
        nombreContacto, cargoContacto, correoContacto, telefonoContacto,
        sede, auditorioNombre, fecha, horaInicio, horaFin,
        nombreEvento, tipoEvento, descripcionEvento, numAsistentes, requiereEquipos
    } = req.body;

    if (!auditorioNombre || !nombreEvento || !numAsistentes ||
        !nombreContacto || !telefonoContacto || !correoContacto ||
        !fecha || !horaInicio || !horaFin) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    const duracion = (hF * 60 + mF - hI * 60 - mI) / 60;
    if (duracion !== 4 && duracion !== 6) {
        return res.status(400).json({ error: 'La duración debe ser exactamente 4 o 6 horas' });
    }

    const OFFSET_MINUTES = 300;
    const MIN_START_MINUTES = 6 * 60;
    const MAX_END_MINUTES = 23 * 60;

    const toColombiaMinutes = (date) => {
        const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
        return ((utcMinutes - OFFSET_MINUTES) % 1440 + 1440) % 1440;
    };

    const eventStart = new Date(`${fecha}T${horaInicio}:00.000-05:00`);
    const eventEnd = new Date(eventStart.getTime() + duracion * 60 * 60 * 1000);

    const startMinutesCol = toColombiaMinutes(eventStart);
    const endMinutesCol = toColombiaMinutes(eventEnd);

    if (startMinutesCol < MIN_START_MINUTES) {
        return res.status(400).json({ error: 'El evento no puede iniciar antes de las 6:00am' });
    }
    if (endMinutesCol <= startMinutesCol || endMinutesCol > MAX_END_MINUTES) {
        return res.status(400).json({ error: 'El evento no puede terminar después de las 11:00pm' });
    }

    try {
        // Buscar auditorio por nombre
        let auditoriumId;
        const simpleName = auditorioNombre.replace(/\d+\/\d+/g, '').trim();
        const keywords = simpleName.split(/\s+/).filter(w => w.length > 2).slice(0, 3);

        if (keywords.length > 0) {
            const likePattern = '%' + keywords.join('%') + '%';
            const result = await pool.query(
                `SELECT id, name FROM auditoriums WHERE name ILIKE $1 AND is_active = TRUE LIMIT 1`,
                [likePattern]
            );
            if (result.rows.length > 0) {
                auditoriumId = result.rows[0].id;
            }
        }

        if (!auditoriumId) {
            const allResult = await pool.query(
                `SELECT id, name FROM auditoriums WHERE is_active = TRUE LIMIT 1`
            );
            if (allResult.rows.length === 0) {
                return res.status(404).json({ error: 'No hay auditorios activos disponibles' });
            }
            auditoriumId = allResult.rows[0].id;
        }

        // Asignar tarifa
        const extType = getExternalType(tipoEntidad);
        let tarifaAplicada = null;
        try {
            const tariffResult = await pool.query(`
                SELECT price FROM tariffs
                WHERE auditorium_id = $1
                  AND external_type = $2::external_type
                  AND hours = $3
                  AND effective_from <= CURRENT_DATE
                ORDER BY effective_from DESC
                LIMIT 1
            `, [auditoriumId, extType, duracion]);
            if (tariffResult.rows.length > 0) {
                tarifaAplicada = tariffResult.rows[0].price;
            }
        } catch (_) {}

        // Insertar en external_requests
        const result = await pool.query(`
            INSERT INTO external_requests (
                nombre_entidad, tipo_entidad, nit,
                nombre_contacto, cargo_contacto, correo_contacto, telefono_contacto,
                sede, auditorio_nombre, fecha, hora_inicio, hora_fin,
                nombre_evento, tipo_evento, descripcion_evento,
                num_asistentes, requiere_equipos, tarifa_aplicada
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
            RETURNING id
        `, [
            nombreEntidad || null,
            tipoEntidad || null,
            nit || null,
            nombreContacto,
            cargoContacto || null,
            correoContacto,
            telefonoContacto,
            sede || null,
            auditorioNombre,
            fecha,
            horaInicio,
            horaFin,
            nombreEvento,
            tipoEvento || null,
            descripcionEvento || null,
            parseInt(numAsistentes) || null,
            requiereEquipos ? JSON.stringify(requiereEquipos) : null,
            tarifaAplicada,
        ]);

        res.status(201).json({ id: result.rows[0].id, message: 'Solicitud creada correctamente. Un administrador la revisará pronto.' });

    } catch (error) {
        console.error('Error al crear solicitud externa:', error);
        res.status(500).json({ error: 'Error del servidor al crear la solicitud' });
    }
};

// ── Listar todas las solicitudes externas ──────────────────────────────
const list = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM external_requests ORDER BY fecha_solicitud DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al listar solicitudes externas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ── Obtener una solicitud por ID ────────────────────────────────────────
const getOne = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM external_requests WHERE id = $1', [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener solicitud externa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ── Aprobar solicitud en 2 fases ────────────────────────────────────────
// Phase 1: crea la reserva (bloquea calendario) + registra pago 50%
// Phase 2: registra el pago restante y completa la solicitud
const approve = async (req, res) => {
    const { id } = req.params;
    const { phase, monto, referenciaPago, notaAdmin } = req.body;

    if (!phase || ![1, 2].includes(parseInt(phase))) {
        return res.status(400).json({ error: 'Indique la fase (1 o 2)' });
    }

    try {
        const reqResult = await pool.query(
            'SELECT * FROM external_requests WHERE id = $1', [id]
        );
        if (reqResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const solicitud = reqResult.rows[0];

        // ── FASE 1 ──────────────────────────────────────────────────────
        if (parseInt(phase) === 1) {
            if (solicitud.estado !== 'PENDIENTE') {
                return res.status(400).json({ error: `La solicitud ya fue ${solicitud.estado.toLowerCase()}` });
            }
            if (monto == null || isNaN(Number(monto)) || Number(monto) < 0) {
                return res.status(400).json({ error: 'Monto inválido' });
            }

            // Buscar auditorium_id
            let auditoriumId;
            const simpleName = (solicitud.auditorio_nombre || '').replace(/\d+\/\d+/g, '').trim();
            const keywords = simpleName.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
            if (keywords.length > 0) {
                const likePattern = '%' + keywords.join('%') + '%';
                const result = await pool.query(
                    `SELECT id FROM auditoriums WHERE name ILIKE $1 AND is_active = TRUE LIMIT 1`,
                    [likePattern]
                );
                if (result.rows.length > 0) auditoriumId = result.rows[0].id;
            }
            if (!auditoriumId) {
                const fallback = await pool.query(`SELECT id FROM auditoriums WHERE is_active = TRUE LIMIT 1`);
                if (fallback.rows.length === 0) {
                    return res.status(404).json({ error: 'No hay auditorios activos disponibles' });
                }
                auditoriumId = fallback.rows[0].id;
            }

            const fechaStr = solicitud.fecha instanceof Date
                ? solicitud.fecha.toISOString().split('T')[0]
                : solicitud.fecha;
            const eventStart = new Date(`${fechaStr}T${solicitud.hora_inicio}:00.000-05:00`);
            const [hI, mI] = solicitud.hora_inicio.split(':').map(Number);
            const [hF, mF] = solicitud.hora_fin.split(':').map(Number);
            const duracion = (hF * 60 + mF - hI * 60 - mI) / 60;
            const eventEnd = new Date(eventStart.getTime() + duracion * 60 * 60 * 1000);

            const extType = getExternalType(solicitud.tipo_entidad);
            let appliedTariffId = null;
            const totalCost = solicitud.tarifa_aplicada;
            try {
                const tariffResult = await pool.query(`
                    SELECT id FROM tariffs
                    WHERE auditorium_id = $1
                      AND external_type = $2::external_type
                      AND hours = $3
                      AND effective_from <= CURRENT_DATE
                    ORDER BY effective_from DESC LIMIT 1
                `, [auditoriumId, extType, duracion]);
                if (tariffResult.rows.length > 0) appliedTariffId = tariffResult.rows[0].id;
            } catch (_) {}

            // Verificar conflicto
            const conflict = await pool.query(`
                SELECT id FROM reservations
                WHERE auditorium_id = $1
                  AND status IN ('pendiente', 'aprobada')
                  AND event_start < $3
                  AND event_end   > $2
                LIMIT 1
            `, [auditoriumId, eventStart, eventEnd]);
            if (conflict.rows.length > 0) {
                return res.status(409).json({ error: 'El horario solicitado se cruza con una reserva existente' });
            }

            // Crear reserva con status 'aprobada' (bloquea calendario)
            const reservaResult = await pool.query(`
                INSERT INTO reservations (
                    auditorium_id, event_name, attendees_count,
                    responsible_person, applicant_name, applicant_phone,
                    applicant_email, applicant_external_type,
                    event_start, event_end, applied_tariff_id, total_cost, notes, status
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'aprobada')
                RETURNING id
            `, [
                auditoriumId,
                solicitud.nombre_evento,
                Math.max(1, solicitud.num_asistentes || 1),
                solicitud.nombre_contacto,
                solicitud.nombre_contacto,
                solicitud.telefono_contacto,
                solicitud.correo_contacto,
                extType,
                eventStart,
                eventEnd,
                appliedTariffId,
                totalCost,
                notaAdmin || null,
            ]);
            const reservationId = reservaResult.rows[0].id;
            const usuario = req.user?.full_name || req.user?.email || 'Admin';

            await pool.query(`
                INSERT INTO reservation_history (reservation_id, accion, usuario, descripcion)
                VALUES ($1, 'APROBADA', $2, $3)
            `, [reservationId, usuario, `Solicitud externa aprobada (fase 1) — "${solicitud.nombre_evento}"`]);

            // Crear pago fase 1
            await pool.query(`
                INSERT INTO payments (reservation_id, amount, payment_phase, due_date, paid_at)
                VALUES ($1, $2, 1, NOW(), NOW())
            `, [reservationId, Number(monto)]);

            // Actualizar solicitud
            await pool.query(`
                UPDATE external_requests
                SET estado = 'PRE_APROBADA', estado_pago = 'PARCIAL',
                    reservation_id = $1, monto_fase1 = $3,
                    referencia_fase1 = $4, nota_admin = $5, updated_at = NOW()
                WHERE id = $2
            `, [reservationId, id, Number(monto), referenciaPago || null, notaAdmin || null]);

            return res.json({ message: 'Fase 1 aprobada — reserva creada en calendario', reservationId });
        }

        // ── FASE 2 ──────────────────────────────────────────────────────
        if (parseInt(phase) === 2) {
            if (solicitud.estado !== 'PRE_APROBADA') {
                return res.status(400).json({ error: 'Debe aprobar la fase 1 primero' });
            }
            if (!solicitud.reservation_id) {
                return res.status(400).json({ error: 'No hay reserva asociada' });
            }

            const total = solicitud.tarifa_aplicada || 0;
            const montoPrevio = solicitud.monto_fase1 || 0;
            const montoFase2 = total - montoPrevio;

            if (montoFase2 < 0) {
                return res.status(400).json({ error: 'El monto pagado en fase 1 supera la tarifa total' });
            }

            const usuario = req.user?.full_name || req.user?.email || 'Admin';
            const descripcionFase2 = `Pago fase 2 completado — $${Number(montoFase2).toLocaleString('es-CO')} COP`;

            await pool.query(`
                INSERT INTO reservation_history (reservation_id, accion, usuario, descripcion)
                VALUES ($1, 'PAGADA_FASE2', $2, $3)
            `, [solicitud.reservation_id, usuario, descripcionFase2]);

            // Crear pago fase 2
            await pool.query(`
                INSERT INTO payments (reservation_id, amount, payment_phase, due_date, paid_at)
                VALUES ($1, $2, 2, NOW(), NOW())
            `, [solicitud.reservation_id, montoFase2]);

            // Actualizar solicitud
            await pool.query(`
                UPDATE external_requests
                SET estado = 'APROBADA', estado_pago = 'PAGADO',
                    monto_fase2 = $1, referencia_fase2 = $2,
                    nota_admin = $3, updated_at = NOW()
                WHERE id = $4
            `, [montoFase2, referenciaPago || null, notaAdmin || null, id]);

            return res.json({ message: 'Fase 2 aprobada — solicitud completada', montoFase2 });
        }

    } catch (error) {
        console.error('Error al aprobar solicitud:', error.message, error.stack);
        console.error('Body recibido:', req.body);
        console.error('Params:', req.params);
        res.status(500).json({ error: error.message || 'Error del servidor al aprobar la solicitud', details: error.message });
    }
};

// ── Rechazar solicitud ──────────────────────────────────────────────────
const reject = async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;

    try {
        const result = await pool.query(
            `UPDATE external_requests SET estado = 'RECHAZADA', nota_admin = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
            [motivo || null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.json({ message: 'Solicitud rechazada' });
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ── Registrar estado de pago manual ─────────────────────────────────────
const registerPayment = async (req, res) => {
    const { id } = req.params;
    const { estadoPago } = req.body;

    try {
        const result = await pool.query(`
            UPDATE external_requests
            SET estado_pago = $1, updated_at = NOW()
            WHERE id = $2 RETURNING id
        `, [estadoPago || 'PAGADO', id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.json({ message: 'Estado de pago actualizado' });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ── Cancelar solicitud ──────────────────────────────────────────────────
const cancel = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT estado FROM external_requests WHERE id = $1`, [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const estado = result.rows[0].estado;
        if (estado !== 'PENDIENTE' && estado !== 'PRE_APROBADA') {
            return res.status(400).json({ error: `No se puede cancelar una solicitud ${estado.toLowerCase()}` });
        }

        await pool.query(`
            UPDATE external_requests
            SET estado = 'CANCELADA', updated_at = NOW()
            WHERE id = $1
        `, [id]);
        res.json({ message: 'Solicitud cancelada' });
    } catch (error) {
        console.error('Error al cancelar solicitud:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { createFromForm, list, getOne, approve, reject, registerPayment, cancel };