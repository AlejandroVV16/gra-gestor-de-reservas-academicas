// Index.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./DB/db');

// ── Migración ────────────────────────────────────────────────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS external_requests (
          id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre_entidad      VARCHAR(200),
          tipo_entidad        VARCHAR(100),
          nit                 VARCHAR(500),
          nombre_contacto     VARCHAR(150)    NOT NULL,
          cargo_contacto      VARCHAR(100),
          correo_contacto     VARCHAR(150)    NOT NULL,
          telefono_contacto   VARCHAR(20)     NOT NULL,
          sede                VARCHAR(50),
          auditorio_nombre    VARCHAR(100),
          fecha               DATE            NOT NULL,
          hora_inicio         VARCHAR(5)      NOT NULL,
          hora_fin            VARCHAR(5)      NOT NULL,
          nombre_evento       VARCHAR(200)    NOT NULL,
          tipo_evento         VARCHAR(100),
          descripcion_evento  TEXT,
          num_asistentes      INT,
          requiere_equipos    JSONB,
          estado              VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE',
          estado_pago         VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE_PAGO',
          tarifa_aplicada     NUMERIC(10, 2),
          monto_fase1         NUMERIC(10, 2),
          referencia_fase1    VARCHAR(100),
          monto_fase2         NUMERIC(10, 2),
          referencia_fase2    VARCHAR(100),
          nota_admin          TEXT,
          fecha_solicitud     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
          reservation_id      UUID            REFERENCES reservations(id) ON DELETE SET NULL,
          created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Migración: tabla external_requests lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
          id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
          reservation_id  UUID            NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
          amount          NUMERIC(10, 2)  NOT NULL,
          payment_phase   INT             NOT NULL CHECK (payment_phase IN (1, 2)),
          due_date        TIMESTAMPTZ     NOT NULL,
          paid_at         TIMESTAMPTZ,
          created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Migración: tabla payments lista');

    // Columnas nuevas si la tabla ya existía antes de esta migración
    await pool.query(`ALTER TABLE external_requests ALTER COLUMN nit TYPE VARCHAR(500)`);
    await pool.query(`ALTER TABLE external_requests ADD COLUMN IF NOT EXISTS monto_fase1 NUMERIC(10, 2)`);
    await pool.query(`ALTER TABLE external_requests ADD COLUMN IF NOT EXISTS referencia_fase1 VARCHAR(100)`);
    await pool.query(`ALTER TABLE external_requests ADD COLUMN IF NOT EXISTS monto_fase2 NUMERIC(10, 2)`);
    await pool.query(`ALTER TABLE external_requests ADD COLUMN IF NOT EXISTS referencia_fase2 VARCHAR(100)`);
    await pool.query(`ALTER TABLE external_requests ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL`);
    await pool.query(`ALTER TABLE external_requests ADD COLUMN IF NOT EXISTS nota_admin TEXT`);
    console.log('Migración: columnas adicionales listas');

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS correo VARCHAR(150)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`);
    console.log('Migración: columnas users listas');

    await pool.query(`ALTER TABLE auditoriums ADD COLUMN IF NOT EXISTS image VARCHAR(255)`);
    console.log('Migración: columna image en auditoriums lista');

    await pool.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(150)`);
    console.log('Migración: columna applicant_email en reservations lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipments (
          id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
          name            VARCHAR(100)    NOT NULL UNIQUE,
          quantity        INT             NOT NULL DEFAULT 0 CHECK (quantity >= 0),
          description     TEXT,
          is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
          created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Migración: tabla equipments lista');

    // Seed equipments if empty
    const { rows: eqCount } = await pool.query('SELECT COUNT(*) AS cnt FROM equipments');
    if (Number(eqCount[0].cnt) === 0) {
      await pool.query(`
        INSERT INTO equipments (name, quantity, description) VALUES
          ('Mesas en fórmica',  0, 'Mesas plegables de fórmica para eventos'),
          ('Mesas Rimax',       0, 'Mesas Rimax redondas'),
          ('Sillas Rimax',      0, 'Sillas Rimax apilables'),
          ('Otras sillas',      0, 'Sillas adicionales para eventos'),
          ('Micrófonos',        0, 'Micrófonos inalámbricos'),
          ('Manteles',          0, 'Manteles para mesas'),
          ('Sobre manteles',    0, 'Sobre manteles decorativos')
      `);
      console.log('Migración: equipos seed insertados');
    }

    await pool.query(`UPDATE auditoriums SET image = NULL WHERE image = '{}' OR image = '' OR image ~ '^[0-9]+-'`);
    console.log('Migración: valores corruptos y temporales de image limpiados');

    const { rows: imagenesValidas } = await pool.query(`SELECT image FROM auditoriums WHERE image IS NOT NULL`);
    const setValidos = new Set(imagenesValidas.map(r => r.image));
    const dirAuditorios = path.join(__dirname, 'uploads', 'auditorios');
    if (fs.existsSync(dirAuditorios)) {
      const archivos = fs.readdirSync(dirAuditorios);
      for (const archivo of archivos) {
        if (!setValidos.has(archivo)) {
          fs.unlinkSync(path.join(dirAuditorios, archivo));
        }
      }
      console.log(`Migración: ${archivos.length - setValidos.size} archivos huérfanos eliminados`);
    }

  } catch (err) {
    console.error('Error en migración:', err.message);
  }
})();

const app = express();
app.use(express.json());

// Archivos subidos (RUT PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta Login
app.use('/api/auth', require('./src/routes/authRouter'));

// Rutas
app.use('/api/users', require('./src/routes/usersRoutes'));
app.use('/api/auditoriums', require('./src/routes/auditoriumsRouter'));
app.use('/api/reservations', require('./src/routes/reservationsRouter'));
app.use('/api/solicitudes-externas', require('./src/routes/externalRequestsRouter'));
app.use('/api/dashboard', require('./src/routes/dashboardRouter'));
app.use('/api/history', require('./src/routes/historyRouter'));
app.use('/api/reports', require('./src/routes/reportsRouter'));
app.use('/api/equipments', require('./src/routes/equipmentsRouter'));


app.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});