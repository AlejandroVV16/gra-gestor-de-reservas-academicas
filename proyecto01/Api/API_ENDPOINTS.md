# API - Endpoints Funcionales

## Autenticación

### `POST /api/auth/login`
**Auth:** No requiere
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Respuesta:** `{ token, user_type, full_name }`

---

## Usuarios

### `GET /api/users`
**Auth:** Bearer token
**Descripción:** Obtiene todos los usuarios
**Respuesta:** `[{ id, user_type, full_name, email, phone, created_at, updated_at }]`

---

## Auditorios

### `GET /api/auditoriums`
**Auth:** Bearer token
**Descripción:** Obtiene todos los auditorios
**Respuesta:** `[{ id, name, location, capacity, description, is_active, created_at, updated_at }]`

### `GET /api/auditoriums/active`
**Auth:** No requiere
**Descripción:** Obtiene solo auditorios activos
**Respuesta:** Mismo schema filtrado por `is_active = TRUE`

### `GET /api/auditoriums/:id`
**Auth:** No requiere
**Descripción:** Obtiene un auditorio por UUID
**Respuesta:** `{ id, name, location, capacity, description, is_active, ... }`

---

## Reservas

### `POST /api/reservations`
**Descripción:** Endpoint unificado que maneja dos casos:

#### Caso 1: Reserva interna (con JWT)
**Auth:** Bearer token
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "auditorium_id": "UUID",
  "event_name": "string",
  "attendees_count": "number",
  "responsible_person": "string",
  "applicant_name": "string",
  "applicant_phone": "string",
  "event_start": "ISO date string",
  "event_end": "ISO date string"
}
```
**Validaciones:** Duración exacta 4 o 6h, horario 6am-11pm (Colombia), sin cruce con reservas existentes, auditorio activo
**Respuesta:** `201 Created` con datos de la reserva creada

#### Caso 2: Solicitud externa (sin JWT)
**Auth:** No requiere
**Headers:** `Content-Type: multipart/form-data`
**Body (form-data):**
| Campo | Tipo |
|---|---|
| auditorium_id | UUID |
| event_name | string |
| attendees_count | number |
| responsible_person | string |
| applicant_name | string |
| applicant_phone | string |
| applicant_email | email |
| external_type | "general" \| "escuela_publica" \| "escuela_privada" |
| hours | 4 \| 6 |
| event_start | ISO date string |
| rut_file | file (PDF, JPG o PNG, máx 5MB) |
**Descripción:** Busca tarifa vigente, valida horario/solapamiento, envía email con RUT adjunto via Resend
**Respuesta:** `{ message, precio, event_start, event_end }`
