-- =============================================================
--  EXTENSIONES
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
--  ENUM TYPES
-- =============================================================
CREATE TYPE user_type          AS ENUM ('interno', 'admin');
CREATE TYPE reservation_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'cancelada');
CREATE TYPE external_type      AS ENUM ('general', 'escuela_publica', 'escuela_privada');

-- =============================================================
--  TABLA: users
-- =============================================================
CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type       user_type       NOT NULL,
    full_name       VARCHAR(150)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    correo          VARCHAR(150),
    phone           VARCHAR(20),
    password_hash   TEXT            NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
--  TABLA: auditoriums
-- =============================================================
CREATE TABLE auditoriums (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL,
    location        VARCHAR(200)    NOT NULL,
    capacity        INT             NOT NULL CHECK (capacity > 0),
    description     TEXT,
    image           VARCHAR(255),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
--  TABLA: tariffs
-- =============================================================
CREATE TABLE tariffs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    auditorium_id   UUID            NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
    external_type   external_type   NOT NULL,
    hours           INT             NOT NULL CHECK (hours IN (4, 6)),
    price           NUMERIC(10, 2)  NOT NULL CHECK (price >= 0),
    currency        VARCHAR(5)      NOT NULL DEFAULT 'CLP',
    effective_from  DATE            NOT NULL DEFAULT CURRENT_DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tariffs_auditorium_date
    ON tariffs(auditorium_id, effective_from DESC);

-- =============================================================
--  TABLA: reservations
-- =============================================================
CREATE TABLE reservations (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID                REFERENCES users(id) ON DELETE RESTRICT,
    auditorium_id           UUID                NOT NULL REFERENCES auditoriums(id) ON DELETE RESTRICT,
    event_name              VARCHAR(200)        NOT NULL,
    attendees_count         INT                 NOT NULL CHECK (attendees_count > 0),
    responsible_person      VARCHAR(150)        NOT NULL,
    applicant_name          VARCHAR(150)        NOT NULL,
    applicant_phone         VARCHAR(20)         NOT NULL,
    applicant_rut           VARCHAR(12),
    applicant_email         VARCHAR(150),
    applicant_external_type external_type,
    request_date            DATE                NOT NULL DEFAULT CURRENT_DATE,
    event_start             TIMESTAMPTZ         NOT NULL,
    event_end               TIMESTAMPTZ         NOT NULL,
    status                  reservation_status  NOT NULL DEFAULT 'pendiente',
    applied_tariff_id       UUID                REFERENCES tariffs(id) ON DELETE SET NULL,
    total_cost              NUMERIC(10, 2),
    notes                   TEXT,
    created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_event_dates CHECK (event_end > event_start)
);

CREATE INDEX idx_reservations_user        ON reservations(user_id);
CREATE INDEX idx_reservations_auditorium  ON reservations(auditorium_id);
CREATE INDEX idx_reservations_dates       ON reservations(event_start, event_end);
CREATE INDEX idx_reservations_status      ON reservations(status);

-- =============================================================
--  TABLA: reservation_history
-- =============================================================
CREATE TABLE reservation_history (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id  UUID                NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    accion          VARCHAR(50)         NOT NULL,
    usuario         VARCHAR(150)        NOT NULL,
    descripcion     TEXT                NOT NULL DEFAULT '',
    fecha           TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservation_history_reservation ON reservation_history(reservation_id);
CREATE INDEX idx_reservation_history_fecha       ON reservation_history(fecha DESC);

-- =============================================================
--  TABLA: payments
-- =============================================================
CREATE TABLE payments (
    id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID            NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    amount         NUMERIC(10, 2)  NOT NULL,
    payment_phase  INT             NOT NULL CHECK (payment_phase IN (1, 2)),
    due_date       TIMESTAMPTZ     NOT NULL,
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
--  TABLA: equipments
-- =============================================================
CREATE TABLE equipments (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL UNIQUE,
    quantity        INT             NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
--  TRIGGERS
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_auditoriums_updated_at
    BEFORE UPDATE ON auditoriums
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_equipments_updated_at
    BEFORE UPDATE ON equipments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
--  SEED
-- =============================================================
INSERT INTO auditoriums (name, location, capacity, description, image, is_active) VALUES
    ('Auditorio Rodrigo Rivera Correa',           'Sede Belmonte', 600, 'Auditorio principal con escenario, seis pantallas y ayudas audiovisuales.', 'auditorio-rodrigo-rivera-correa.webp', TRUE),
    ('Auditorio Cesar Gaviria Trujillo',          'Sede Centro',   337, 'Sala equipada con proyector y videoconferencia',               'auditorio-cesar-gaviria-trujillo.webp', TRUE),
    ('Paraninfo Benjamin Herrera',               'Sede Belmonte', 230, 'Espacio flexible para talleres y reuniones',                    'paraninfo-benjamin-herrera.webp', TRUE),
    ('Auditorio Rodrigo Rivera Correa (1/4)',     'Sede Belmonte', 120, 'Espacio flexible para talleres y reuniones',                    'auditorio-rodrigo-rivera-correa-1-4.webp', TRUE),
    ('Auditorio Rodrigo Rivera Correa Ppal(1/2)','Sede Belmonte', 250, 'Espacio flexible para talleres y reuniones',                    'auditorio-rodrigo-rivera-correa-ppal-1-2.webp', TRUE),
    ('Auditorio Auxiliar',                       'Sede Belmonte',  89, 'Espacio flexible para talleres y reuniones',                    'auditorio-auxiliar.webp', TRUE);


INSERT INTO tariffs (auditorium_id, external_type, hours, price)
-- Auditorio Rodrigo Rivera Correa
SELECT id, 'general'::external_type,         4, 4280000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa'
UNION ALL SELECT id, 'general'::external_type,         6, 6400000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa'
UNION ALL SELECT id, 'escuela_privada'::external_type, 4, 3424000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa'
UNION ALL SELECT id, 'escuela_privada'::external_type, 6, 5120000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa'
UNION ALL SELECT id, 'escuela_publica'::external_type, 4, 2568000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa'
UNION ALL SELECT id, 'escuela_publica'::external_type, 6, 3840000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa'
-- Paraninfo Benjamin Herrera
UNION ALL SELECT id, 'general'::external_type,         4, 2140000 FROM auditoriums WHERE name = 'Paraninfo Benjamin Herrera'
UNION ALL SELECT id, 'general'::external_type,         6, 3200000 FROM auditoriums WHERE name = 'Paraninfo Benjamin Herrera'
UNION ALL SELECT id, 'escuela_privada'::external_type, 4, 1712000 FROM auditoriums WHERE name = 'Paraninfo Benjamin Herrera'
UNION ALL SELECT id, 'escuela_privada'::external_type, 6, 2560000 FROM auditoriums WHERE name = 'Paraninfo Benjamin Herrera'
UNION ALL SELECT id, 'escuela_publica'::external_type, 4, 1284000 FROM auditoriums WHERE name = 'Paraninfo Benjamin Herrera'
UNION ALL SELECT id, 'escuela_publica'::external_type, 6, 1920000 FROM auditoriums WHERE name = 'Paraninfo Benjamin Herrera'
-- Auditorio Cesar Gaviria Trujillo
UNION ALL SELECT id, 'general'::external_type,         4, 3210000 FROM auditoriums WHERE name = 'Auditorio Cesar Gaviria Trujillo'
UNION ALL SELECT id, 'general'::external_type,         6, 4800000 FROM auditoriums WHERE name = 'Auditorio Cesar Gaviria Trujillo'
UNION ALL SELECT id, 'escuela_privada'::external_type, 4, 2568000 FROM auditoriums WHERE name = 'Auditorio Cesar Gaviria Trujillo'
UNION ALL SELECT id, 'escuela_privada'::external_type, 6, 3840000 FROM auditoriums WHERE name = 'Auditorio Cesar Gaviria Trujillo'
UNION ALL SELECT id, 'escuela_publica'::external_type, 4, 1926000 FROM auditoriums WHERE name = 'Auditorio Cesar Gaviria Trujillo'
UNION ALL SELECT id, 'escuela_publica'::external_type, 6, 2880000 FROM auditoriums WHERE name = 'Auditorio Cesar Gaviria Trujillo'
-- Auditorio Rodrigo Rivera Correa (1/4)
UNION ALL SELECT id, 'general'::external_type,         4, 1070000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa (1/4)'
UNION ALL SELECT id, 'general'::external_type,         6, 1600000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa (1/4)'
UNION ALL SELECT id, 'escuela_privada'::external_type, 4,  856000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa (1/4)'
UNION ALL SELECT id, 'escuela_privada'::external_type, 6, 1280000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa (1/4)'
UNION ALL SELECT id, 'escuela_publica'::external_type, 4,  642000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa (1/4)'
UNION ALL SELECT id, 'escuela_publica'::external_type, 6,  960000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa (1/4)'
-- Auditorio Rodrigo Rivera Correa Ppal(1/2)
UNION ALL SELECT id, 'general'::external_type,         4, 2140000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa Ppal(1/2)'
UNION ALL SELECT id, 'general'::external_type,         6, 3200000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa Ppal(1/2)'
UNION ALL SELECT id, 'escuela_privada'::external_type, 4, 1712000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa Ppal(1/2)'
UNION ALL SELECT id, 'escuela_privada'::external_type, 6, 2560000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa Ppal(1/2)'
UNION ALL SELECT id, 'escuela_publica'::external_type, 4, 1284000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa Ppal(1/2)'
UNION ALL SELECT id, 'escuela_publica'::external_type, 6, 1920000 FROM auditoriums WHERE name = 'Auditorio Rodrigo Rivera Correa Ppal(1/2)'
-- Auditorio Auxiliar
UNION ALL SELECT id, 'general'::external_type,         4,  800000 FROM auditoriums WHERE name = 'Auditorio Auxiliar'
UNION ALL SELECT id, 'general'::external_type,         6, 1200000 FROM auditoriums WHERE name = 'Auditorio Auxiliar'
UNION ALL SELECT id, 'escuela_privada'::external_type, 4,  600000 FROM auditoriums WHERE name = 'Auditorio Auxiliar'
UNION ALL SELECT id, 'escuela_privada'::external_type, 6,  900000 FROM auditoriums WHERE name = 'Auditorio Auxiliar'
UNION ALL SELECT id, 'escuela_publica'::external_type, 4,  400000 FROM auditoriums WHERE name = 'Auditorio Auxiliar'
UNION ALL SELECT id, 'escuela_publica'::external_type, 6,  600000 FROM auditoriums WHERE name = 'Auditorio Auxiliar';

INSERT INTO users (user_type, full_name, email, correo, password_hash, is_active) VALUES
    ('admin', 'Lindelia González', 'lindelia', 'lindelia@unilibre.edu.co', crypt('1234', gen_salt('bf', 10)), TRUE),
    ('interno', 'Johns Betancur', 'johns', 'johns@unilibre.edu.co', crypt('1234', gen_salt('bf', 10)), TRUE),
    ('interno', 'Alex Bedoya', 'alex', 'alex@unilibre.edu.co', crypt('1234', gen_salt('bf', 10)), TRUE),
    ('interno', 'Diana Henao', 'diana', 'diana@unilibre.edu.co', crypt('1234', gen_salt('bf', 10)), FALSE);

-- =============================================================
--  SEED: equipments
-- =============================================================
INSERT INTO equipments (name, quantity, description) VALUES
    ('Mesas en fórmica',  0, 'Mesas plegables de fórmica para eventos'),
    ('Mesas Rimax',       0, 'Mesas Rimax redondas'),
    ('Sillas Rimax',      0, 'Sillas Rimax apilables'),
    ('Otras sillas',      0, 'Sillas adicionales para eventos'),
    ('Micrófonos',        0, 'Micrófonos inalámbricos'),
    ('Manteles',          0, 'Manteles para mesas'),
    ('Sobre manteles',    0, 'Sobre manteles decorativos');