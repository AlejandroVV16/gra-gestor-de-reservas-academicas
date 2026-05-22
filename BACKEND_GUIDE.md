# GRA — Guía completa de Backend para el equipo de Python

> **Gestor de Reservas Académicas · Universidad Libre Seccional Pereira**  
> Este documento está dirigido al equipo de backend. Describe exactamente qué debe implementar
> para que el frontend React funcione al 100 % sin ningún cambio de código en el lado del cliente.

---

## 1. Stack tecnológico

| Capa | Fase prototipo | Fase producción |
|---|---|---|
| Framework web | **FastAPI** | **FastAPI** (sin cambios) |
| Base de datos | **SQLite** ← estamos aquí | PostgreSQL |
| ORM | **SQLAlchemy 2.x** + Alembic | **SQLAlchemy 2.x** + Alembic (sin cambios) |
| Autenticación | **python-jose** + **passlib[bcrypt]** | Sin cambios |
| Servidor ASGI | **Uvicorn** | Gunicorn + Uvicorn workers |
| Variables de entorno | **python-dotenv** | Sin cambios |

> ✅ **Ventaja de SQLite en esta fase:** no requiere instalar ni configurar ningún servidor de BD.
> El archivo `gra.db` se crea automáticamente en la carpeta del proyecto al primer arranque.
> Cuando se apruebe el prototipo, migrar a PostgreSQL requiere cambiar **una sola línea** en `.env`.

### Instalación de dependencias

```bash
pip install fastapi uvicorn[standard] sqlalchemy alembic \
            python-jose[cryptography] passlib[bcrypt] python-dotenv \
            python-multipart openpyxl
```

> SQLite ya viene incluido en Python — no necesita instalación adicional.
> A diferencia de PostgreSQL, **no se necesita `psycopg2-binary`**.

Guardar las dependencias:
```bash
pip freeze > requirements.txt
```

---

## 2. Estructura de carpetas del proyecto

```
gra-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  ← punto de entrada, configura FastAPI + CORS
│   │
│   ├── core/
│   │   ├── config.py            ← variables de entorno (.env)
│   │   ├── security.py          ← JWT: crear y verificar tokens
│   │   └── deps.py              ← dependencias inyectables (get_db, get_current_user)
│   │
│   ├── db/
│   │   ├── base.py              ← Base declarativa de SQLAlchemy
│   │   ├── session.py           ← engine + SessionLocal (config SQLite)
│   │   ├── types.py             ← tipo JSONList (reemplaza ARRAY para SQLite)
│   │   └── init_db.py           ← datos iniciales (auditorios y usuario admin)
│   │
│   ├── models/                  ← Tablas de la BD (SQLAlchemy ORM)
│   │   ├── usuario.py
│   │   ├── auditorio.py
│   │   ├── reserva.py
│   │   ├── historial.py
│   │   └── solicitud_externa.py ← ★ NUEVO — entidades externas
│   │
│   ├── schemas/                 ← Validación de entrada/salida (Pydantic)
│   │   ├── auth.py
│   │   ├── usuario.py
│   │   ├── auditorio.py
│   │   ├── reserva.py
│   │   ├── historial.py
│   │   ├── reporte.py
│   │   └── solicitud_externa.py ← ★ NUEVO
│   │
│   ├── crud/                    ← Lógica de base de datos (queries)
│   │   ├── usuario.py
│   │   ├── auditorio.py
│   │   ├── reserva.py
│   │   ├── historial.py
│   │   └── solicitud_externa.py ← ★ NUEVO
│   │
│   └── routers/                 ← Endpoints HTTP (uno por recurso)
│       ├── auth.py
│       ├── reservas.py
│       ├── auditorios.py
│       ├── usuarios.py
│       ├── historial.py
│       ├── reportes.py
│       └── solicitudes_externas.py ← ★ NUEVO (incluye endpoint público sin auth)
│
├── alembic/                     ← Migraciones de BD
├── alembic.ini
├── gra.db                       ← archivo SQLite (se crea automáticamente, NO subir a git)
├── .env                         ← Variables de entorno (NO subir a git)
├── .env.example
├── .gitignore
└── requirements.txt
```

Agregar al `.gitignore`:
```
gra.db
.env
venv/
__pycache__/
*.pyc
```

---

## 3. Variables de entorno (`.env`)

```env
# ── Base de datos ──────────────────────────────────────────────────────────────
# SQLite — fase prototipo (el archivo gra.db se crea solo en la raíz del proyecto)
DATABASE_URL=sqlite:///./gra.db

# ── JWT ────────────────────────────────────────────────────────────────────────
SECRET_KEY=una-clave-secreta-muy-larga-y-aleatoria-de-al-menos-32-caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# ── App ────────────────────────────────────────────────────────────────────────
APP_ENV=development
```

Crear también `.env.example` (este sí va al repositorio, sin valores reales):
```env
DATABASE_URL=sqlite:///./gra.db
SECRET_KEY=cambiar-por-clave-real
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
APP_ENV=development
```

---

## 4. Configuración de la BD — `app/db/session.py`

SQLite requiere el parámetro `check_same_thread=False` para funcionar con FastAPI
(que es asíncrono y puede usar múltiples hilos):

```python
# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# connect_args es exclusivo de SQLite — no se necesita en PostgreSQL
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

---

## 5. Tipo JSONList — `app/db/types.py`

SQLite no tiene el tipo `ARRAY` nativo de PostgreSQL. La solución es guardar las listas
como texto JSON en la base de datos. Este tipo personalizado hace la conversión de forma
completamente transparente: el código Python y el frontend siguen trabajando con listas normales.

```python
# app/db/types.py
import json
from sqlalchemy import String
from sqlalchemy.types import TypeDecorator

class JSONList(TypeDecorator):
    """
    Almacena listas Python como JSON en un campo TEXT de SQLite.
    Se comporta igual que ARRAY(String) de PostgreSQL para el código de la app.

    Ejemplos:
        Python → BD:   ['Proyector', 'Micrófono']  →  '["Proyector", "Micrófono"]'
        BD → Python:   '["SI", "SD"]'              →  ['SI', 'SD']
        Vacío:         []                           →  '[]'
    """
    impl        = String
    cache_ok    = True

    def process_bind_param(self, value, dialect):
        """Antes de guardar en BD: lista → JSON string"""
        if value is None:
            return "[]"
        return json.dumps(value, ensure_ascii=False)

    def process_result_value(self, value, dialect):
        """Al leer de BD: JSON string → lista"""
        if not value:
            return []
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return []
```

> ⚠️ **Nota para la migración a PostgreSQL:**
> Cuando cambies a PostgreSQL, reemplaza `JSONList` por `ARRAY(String)` de SQLAlchemy
> en los modelos. No hay ningún otro cambio necesario.

---

## 6. Modelos de base de datos

### `app/models/usuario.py`
```python
from sqlalchemy import Column, Integer, String, Enum, DateTime
from app.db.base import Base
import enum

class RolEnum(str, enum.Enum):
    ADMINISTRADOR = "ADMINISTRADOR"
    PERSONAL_TI   = "PERSONAL_TI"

class EstadoUsuarioEnum(str, enum.Enum):
    ACTIVO   = "ACTIVO"
    INACTIVO = "INACTIVO"

class Usuario(Base):
    __tablename__ = "usuarios"

    id              = Column(Integer, primary_key=True, index=True)
    nombre          = Column(String(100), nullable=False)
    apellido        = Column(String(100), nullable=False)
    usuario         = Column(String(50),  unique=True, nullable=False, index=True)
    correo          = Column(String(150), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    rol             = Column(Enum(RolEnum), nullable=False)
    estado          = Column(Enum(EstadoUsuarioEnum), default=EstadoUsuarioEnum.ACTIVO)
    ultima_conexion = Column(DateTime, nullable=True)
```

### `app/models/auditorio.py`
```python
from sqlalchemy import Column, Integer, String, Enum, Boolean
from app.db.base import Base
from app.db.types import JSONList   # ← tipo propio para SQLite
import enum

class EstadoAuditorioEnum(str, enum.Enum):
    ACTIVO   = "ACTIVO"
    INACTIVO = "INACTIVO"

class Auditorio(Base):
    __tablename__ = "auditorios"

    id           = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(150), unique=True, nullable=False)
    sede         = Column(String(100), nullable=False)
    capacidad    = Column(Integer, nullable=False)
    estado       = Column(Enum(EstadoAuditorioEnum), default=EstadoAuditorioEnum.ACTIVO)
    equipamiento = Column(JSONList, default=list)   # ej: ['Proyector', 'Micrófono']
    descripcion  = Column(String(300), nullable=True)
    divisible    = Column(Boolean, default=False)
    # secciones solo aplica si divisible=True
    # ej: [{"id":"SI","label":"Superior Izquierda","capacidad":8}, ...]
    secciones    = Column(JSONList, default=list)
```

### `app/models/reserva.py`
```python
from sqlalchemy import Column, Integer, String, Date, Time, Enum, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import JSONList   # ← tipo propio para SQLite
import enum

class EstadoReservaEnum(str, enum.Enum):
    PENDIENTE  = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA  = "CANCELADA"
    CONFLICTO  = "CONFLICTO"

# Tabla intermedia reserva ↔ usuario (personal TI asignado)
reserva_personal_ti = Table(
    "reserva_personal_ti",
    Base.metadata,
    Column("reserva_id", Integer, ForeignKey("reservas.id")),
    Column("usuario_id", Integer, ForeignKey("usuarios.id")),
)

class Reserva(Base):
    __tablename__ = "reservas"

    id            = Column(Integer, primary_key=True, index=True)
    fecha         = Column(Date,    nullable=False, index=True)
    hora_inicio   = Column(Time,    nullable=False)
    hora_fin      = Column(Time,    nullable=False)
    auditorio_id  = Column(Integer, ForeignKey("auditorios.id"), nullable=False)
    encargado     = Column(String(150), nullable=False)
    facultad      = Column(String(150), nullable=False)
    tipo_evento   = Column(String(100), nullable=True)
    nombre_evento = Column(String(200), nullable=False)
    descripcion   = Column(String(500), nullable=True)
    personas      = Column(Integer, nullable=False)
    equipos       = Column(JSONList, default=list)  # ej: ['Proyector']
    estado        = Column(Enum(EstadoReservaEnum), default=EstadoReservaEnum.PENDIENTE)
    # IDs de secciones seleccionadas — vacío = sala completa
    # ej: ['SI', 'SD'] para Superior Izquierda + Superior Derecha del Rodrigo Rivera
    secciones     = Column(JSONList, default=list)

    auditorio     = relationship("Auditorio")
    personal_ti   = relationship("Usuario", secondary=reserva_personal_ti)
```

### `app/models/historial.py`
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime
import enum

class TipoAccionEnum(str, enum.Enum):
    CREADA             = "CREADA"
    EDITADA            = "EDITADA"
    CANCELADA          = "CANCELADA"
    CONFLICTO_RESUELTO = "CONFLICTO_RESUELTO"

class HistorialAccion(Base):
    __tablename__ = "historial_acciones"

    id          = Column(Integer, primary_key=True, index=True)
    fecha_hora  = Column(DateTime, default=datetime.utcnow, index=True)
    reserva_id  = Column(Integer, ForeignKey("reservas.id"), nullable=False)
    tipo_accion = Column(Enum(TipoAccionEnum), nullable=False)
    usuario     = Column(String(100), nullable=False)  # nombre del usuario que actuó
    descripcion = Column(String(300), nullable=True)

    reserva     = relationship("Reserva")
```

---

## 7. Datos iniciales — `app/db/init_db.py`

Este script puebla la BD con los auditorios reales y un usuario administrador la primera vez.
Se ejecuta una sola vez al arrancar el servidor si la BD está vacía.

```python
# app/db/init_db.py
from sqlalchemy.orm import Session
from app.models.usuario   import Usuario,   RolEnum, EstadoUsuarioEnum
from app.models.auditorio import Auditorio, EstadoAuditorioEnum
from app.core.security    import hash_password

def seed(db: Session) -> None:
    """Inserta datos base solo si las tablas están vacías."""

    # ── Auditorios ─────────────────────────────────────────────────────────────
    if db.query(Auditorio).count() == 0:
        auditorios = [
            Auditorio(
                nombre       = "Benjamín Herrera",
                sede         = "CENTRO",
                capacidad    = 96,
                estado       = EstadoAuditorioEnum.ACTIVO,
                equipamiento = ["Proyector", "Micrófono", "Cámaras"],
                descripcion  = "Auditorio principal del campus Centro",
                divisible    = False,
                secciones    = [],
            ),
            Auditorio(
                nombre       = "Rodrigo Rivera",
                sede         = "CENTRO",
                capacidad    = 30,
                estado       = EstadoAuditorioEnum.ACTIVO,
                equipamiento = ["Proyector", "Micrófono"],
                descripcion  = "Sala de conferencias divisible en hasta 4 secciones independientes",
                divisible    = True,
                secciones    = [
                    {"id": "SI", "label": "Superior Izquierda", "capacidad": 8},
                    {"id": "SD", "label": "Superior Derecha",   "capacidad": 8},
                    {"id": "II", "label": "Inferior Izquierda", "capacidad": 7},
                    {"id": "ID", "label": "Inferior Derecha",   "capacidad": 7},
                ],
            ),
            Auditorio(
                nombre       = "Sala Auxiliar 1",
                sede         = "CENTRO",
                capacidad    = 20,
                estado       = EstadoAuditorioEnum.ACTIVO,
                equipamiento = ["Proyector"],
                descripcion  = "Sala auxiliar de reuniones",
                divisible    = False,
                secciones    = [],
            ),
            Auditorio(
                nombre       = "Sala de Sistemas 1",
                sede         = "BELMONTE",
                capacidad    = 40,
                estado       = EstadoAuditorioEnum.INACTIVO,
                equipamiento = ["Proyector", "Micrófono"],
                descripcion  = "Laboratorio de sistemas Belmonte",
                divisible    = False,
                secciones    = [],
            ),
        ]
        db.add_all(auditorios)

    # ── Usuarios ───────────────────────────────────────────────────────────────
    if db.query(Usuario).count() == 0:
        usuarios = [
            Usuario(
                nombre          = "Lindelia",
                apellido        = "González",
                usuario         = "lindelia",
                correo          = "lindelia@unilibre.edu.co",
                hashed_password = hash_password("1234"),
                rol             = RolEnum.ADMINISTRADOR,
                estado          = EstadoUsuarioEnum.ACTIVO,
            ),
            Usuario(
                nombre          = "Johns",
                apellido        = "Betancur",
                usuario         = "johns",
                correo          = "johns@unilibre.edu.co",
                hashed_password = hash_password("1234"),
                rol             = RolEnum.PERSONAL_TI,
                estado          = EstadoUsuarioEnum.ACTIVO,
            ),
            Usuario(
                nombre          = "Alex",
                apellido        = "Bedoya",
                usuario         = "alex",
                correo          = "alex@unilibre.edu.co",
                hashed_password = hash_password("1234"),
                rol             = RolEnum.PERSONAL_TI,
                estado          = EstadoUsuarioEnum.ACTIVO,
            ),
        ]
        db.add_all(usuarios)

    db.commit()
```

---

## 8. Configuración principal — `app/main.py`

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base    import Base
from app.db.session import engine, SessionLocal
from app.db.init_db import seed
from app.routers    import auth, reservas, auditorios, usuarios, historial, reportes

app = FastAPI(
    title       = "GRA — Gestor de Reservas Académicas",
    description = "API para la Universidad Libre Seccional Pereira",
    version     = "1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# CRÍTICO: el frontend corre en localhost:3000 o :3001 durante desarrollo.
# En producción reemplazar con el dominio real del frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://tu-dominio-produccion.com",   # ← agregar cuando se despliegue
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Crear tablas y poblar datos iniciales ──────────────────────────────────────
@app.on_event("startup")
def startup():
    # Crea todas las tablas en gra.db si no existen todavía
    Base.metadata.create_all(bind=engine)
    # Inserta auditorios y usuarios base si la BD está vacía
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(reservas.router,   prefix="/api/reservas",   tags=["Reservas"])
app.include_router(auditorios.router, prefix="/api/auditorios", tags=["Auditorios"])
app.include_router(usuarios.router,   prefix="/api/usuarios",   tags=["Usuarios"])
app.include_router(historial.router,  prefix="/api/historial",  tags=["Historial"])
app.include_router(reportes.router,   prefix="/api/reportes",   tags=["Reportes"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "GRA Backend", "db": "SQLite (prototipo)"}
```

> ⚠️ **IMPORTANTE — un cambio en el frontend para conectar:**
> El frontend apunta a `http://localhost:8000` sin prefijo. Como el backend usa `/api`,
> hay que editar **una sola línea** en `src/api/axiosInstance.js`:
> ```js
> // Cambiar:
> baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
> // Por:
> baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
> ```
> O crear `.env.local` en la carpeta del frontend con:
> ```env
> VITE_API_URL=http://localhost:8000/api
> ```

---

## 9. Seguridad JWT — `app/core/security.py`

```python
# app/core/security.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire  = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

---

## 10. Contratos de API — todos los endpoints

> El frontend consume exactamente estas rutas con estos payloads y nombres de campos.
> Si un campo cambia de nombre, la integración falla sin tocar el frontend.

---

### 🔐 AUTH

#### `POST /api/auth/login`
**Body:**
```json
{ "usuario": "lindelia", "contrasena": "1234" }
```
**Respuesta 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Lindelia",
    "apellido": "González",
    "usuario": "lindelia",
    "correo": "lindelia@unilibre.edu.co",
    "rol": "ADMINISTRADOR"
  }
}
```
**Error 401:** `{ "detail": "Credenciales incorrectas" }`

```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps    import get_db
from app.core.security import verify_password, create_access_token
from app.crud import usuario as crud_usuario

router = APIRouter()

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    user = crud_usuario.get_by_username(db, data["usuario"])
    if not user or not verify_password(data["contrasena"], user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_access_token({"sub": str(user.id), "rol": user.rol})
    crud_usuario.update_last_login(db, user.id)
    return {
        "token": token,
        "user": {
            "id": user.id, "nombre": user.nombre, "apellido": user.apellido,
            "usuario": user.usuario, "correo": user.correo, "rol": user.rol,
        }
    }
```

---

### 📅 RESERVAS

#### `GET /api/reservas`
**Query params (todos opcionales):**
```
fecha=2026-05-17        → filtra por fecha exacta
auditorio=Benjamín Herrera
estado=CONFIRMADA
page=1
size=20
```
**Respuesta 200:**
```json
{
  "items": [
    {
      "id": 1,
      "fecha": "2026-05-17",
      "horaInicio": "09:00",
      "horaFin": "11:00",
      "auditorio": "Benjamín Herrera",
      "encargado": "Lindelia",
      "facultad": "Ingeniería",
      "evento": "Charla académica",
      "personas": 80,
      "estado": "CONFIRMADA",
      "secciones": [],
      "personalTI": [
        { "id": 2, "nombre": "Johns", "apellido": "Betancur" }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

#### `GET /api/reservas/{id}`
**Respuesta 200:** misma estructura que un item del listado  
**Error 404:** `{ "detail": "Reserva no encontrada" }`

#### `POST /api/reservas`
**Requiere:** `Authorization: Bearer <token>`
```json
{
  "fecha": "2026-05-18",
  "horaInicio": "09:00",
  "horaFin": "11:00",
  "auditorioId": 2,
  "encargado": "Carlos E.",
  "facultad": "Ingeniería",
  "tipoEvento": "Taller",
  "nombreEvento": "Taller de sistemas",
  "descripcion": "Descripción opcional",
  "personas": 16,
  "equipos": ["Proyector", "Micrófono"],
  "personalTI": [2, 3],
  "secciones": ["SI", "SD"]
}
```
> `secciones`: array de IDs. `[]` = sala completa, `["SI","SD"]` = 2 secciones del Rodrigo Rivera.  
> `personalTI`: array de IDs de usuarios con rol PERSONAL_TI.

**Respuesta 201:** reserva creada completa  
**Error 409:** `{ "detail": "Conflicto de horario con reserva #5" }`

#### `PUT /api/reservas/{id}`
**Requiere:** rol `ADMINISTRADOR`  
**Body:** mismo esquema que POST  
**Respuesta 200:** reserva actualizada

#### `DELETE /api/reservas/{id}`
**Requiere:** rol `ADMINISTRADOR`  
**Respuesta 204:** sin cuerpo  
> **Nunca borrar físicamente.** Solo cambiar `estado = "CANCELADA"` y registrar en historial.

#### `GET /api/reservas/{id}/historial`
**Respuesta 200:**
```json
[
  {
    "fecha": "2026-05-16T08:30:00",
    "accion": "CREADA",
    "usuario": "Lindelia",
    "descripcion": "Reserva creada desde el formulario"
  }
]
```

---

### 🏛️ AUDITORIOS

#### `GET /api/auditorios`
**Respuesta 200:**
```json
[
  {
    "id": 1,
    "nombre": "Benjamín Herrera",
    "sede": "CENTRO",
    "capacidad": 96,
    "estado": "ACTIVO",
    "equipamiento": ["Proyector", "Micrófono", "Cámaras"],
    "descripcion": "Auditorio principal del campus Centro",
    "divisible": false,
    "secciones": []
  },
  {
    "id": 2,
    "nombre": "Rodrigo Rivera",
    "sede": "CENTRO",
    "capacidad": 30,
    "estado": "ACTIVO",
    "equipamiento": ["Proyector", "Micrófono"],
    "descripcion": "Sala divisible en hasta 4 secciones",
    "divisible": true,
    "secciones": [
      { "id": "SI", "label": "Superior Izquierda", "capacidad": 8 },
      { "id": "SD", "label": "Superior Derecha",   "capacidad": 8 },
      { "id": "II", "label": "Inferior Izquierda", "capacidad": 7 },
      { "id": "ID", "label": "Inferior Derecha",   "capacidad": 7 }
    ]
  }
]
```

#### `GET /api/auditorios/{id}/disponibilidad`
**Query params:**
```
fecha=2026-05-18
hora_inicio=09:00
hora_fin=11:00
secciones=SI,SD     (opcional — para verificar secciones específicas)
```
**Respuesta 200 — libre:**
```json
{ "disponible": true, "conflictos": [] }
```
**Respuesta 200 — ocupado:**
```json
{
  "disponible": false,
  "conflictos": [
    {
      "reservaId": 5,
      "evento": "Taller fortalecimiento",
      "horaInicio": "08:00",
      "horaFin": "10:00",
      "encargado": "Javier P."
    }
  ]
}
```
**Lógica de conflicto:**
```python
# Hay conflicto cuando se cumplan TODAS estas condiciones:
# 1. Mismo auditorio
# 2. Misma fecha
# 3. Solapamiento: hora_inicio_nueva < hora_fin_existente
#                 AND hora_fin_nueva > hora_inicio_existente
# 4. Estado de la reserva existente != CANCELADA
# 5. Si ambas reservas usan secciones → conflicto solo si comparten alguna sección
#    Si alguna usa sala completa (secciones=[]) → siempre hay conflicto
```

#### `POST /api/auditorios` y `PUT /api/auditorios/{id}`
**Requiere:** rol `ADMINISTRADOR`
```json
{
  "nombre": "Sala Nueva",
  "sede": "BELMONTE",
  "capacidad": 50,
  "equipamiento": ["Proyector"],
  "descripcion": "...",
  "divisible": false
}
```

---

### 👥 USUARIOS

#### `GET /api/usuarios` — requiere `ADMINISTRADOR`
**Respuesta 200:**
```json
[
  {
    "id": 1,
    "nombre": "Lindelia",
    "apellido": "González",
    "usuario": "lindelia",
    "correo": "lindelia@unilibre.edu.co",
    "rol": "ADMINISTRADOR",
    "estado": "ACTIVO",
    "ultimaConexion": "2026-05-16T15:22:00"
  }
]
```

#### `POST /api/usuarios` — requiere `ADMINISTRADOR`
```json
{
  "nombre": "María",
  "apellido": "López",
  "usuario": "maria",
  "correo": "maria@unilibre.edu.co",
  "contrasena": "contraseña_inicial",
  "rol": "PERSONAL_TI"
}
```
**Respuesta 201:** usuario creado (nunca devolver `hashed_password`)

#### `PUT /api/usuarios/{id}` — requiere `ADMINISTRADOR`
**Body:** mismos campos. `contrasena` es opcional — solo enviar si se quiere cambiar.

---

### 📋 HISTORIAL

#### `GET /api/historial` — requiere `ADMINISTRADOR`
**Query params:**
```
page=1
size=20
tipo=CREADA          (opcional)
desde=2026-05-01     (opcional)
hasta=2026-05-31     (opcional)
```
**Respuesta 200:**
```json
{
  "items": [
    {
      "id": 1,
      "fechaHora": "2026-05-16T08:30:00",
      "reservaId": 1,
      "reservaNombre": "Charla académica",
      "auditorio": "Benjamín Herrera",
      "tipoAccion": "CREADA",
      "usuario": "Lindelia",
      "descripcion": "Reserva creada desde el formulario"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

### 📊 REPORTES

#### `GET /api/reportes/resumen` — requiere `ADMINISTRADOR`
**Query params:** `desde=2026-05-01`, `hasta=2026-05-31`  
**Respuesta 200:**
```json
{
  "totalReservas": 42,
  "porAuditorio": [
    { "nombre": "Benjamín Herrera", "total": 18 },
    { "nombre": "Rodrigo Rivera",   "total": 15 }
  ],
  "porFacultad": [
    { "nombre": "Ingeniería",           "total": 20 },
    { "nombre": "Ciencias de la Salud", "total": 12 }
  ],
  "porEstado": [
    { "nombre": "CONFIRMADA", "total": 30 },
    { "nombre": "PENDIENTE",  "total": 8  },
    { "nombre": "CANCELADA",  "total": 4  }
  ],
  "porDia": [
    { "fecha": "2026-05-01", "total": 3 },
    { "fecha": "2026-05-02", "total": 5 }
  ]
}
```

#### `GET /api/reportes/exportar` — requiere `ADMINISTRADOR`
**Query params:** `desde=`, `hasta=`  
**Respuesta:** archivo Excel `.xlsx`

```python
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
import io

@router.get("/exportar")
def exportar(desde: str, hasta: str, db: Session = Depends(get_db)):
    reservas = crud_reserva.get_by_rango(db, desde, hasta)

    wb = Workbook()
    ws = wb.active
    ws.title = "Reservas GRA"
    ws.append(["ID", "Fecha", "Hora Inicio", "Hora Fin", "Auditorio",
                "Encargado", "Facultad", "Evento", "Personas", "Estado", "Secciones"])

    for r in reservas:
        ws.append([
            r.id, str(r.fecha), str(r.hora_inicio), str(r.hora_fin),
            r.auditorio.nombre, r.encargado, r.facultad,
            r.nombre_evento, r.personas, r.estado,
            ", ".join(r.secciones) if r.secciones else "Sala completa"
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=reporte_GRA_{desde}.xlsx"}
    )
```

---

## 11. Registrar automáticamente en el historial

Cada vez que se cree, edite o cancele una reserva, insertar un registro en `historial_acciones`:

```python
# app/crud/reserva.py
from app.models.historial import HistorialAccion, TipoAccionEnum

def crear_reserva(db: Session, data: dict, usuario_nombre: str) -> Reserva:
    reserva = Reserva(
        fecha         = data["fecha"],
        hora_inicio   = data["horaInicio"],
        hora_fin      = data["horaFin"],
        auditorio_id  = data["auditorioId"],
        encargado     = data["encargado"],
        facultad      = data["facultad"],
        tipo_evento   = data.get("tipoEvento"),
        nombre_evento = data["nombreEvento"],
        descripcion   = data.get("descripcion"),
        personas      = data["personas"],
        equipos       = data.get("equipos", []),
        secciones     = data.get("secciones", []),
    )
    db.add(reserva)
    db.flush()  # obtiene el ID antes del commit

    # Asignar personal TI (relación many-to-many)
    for uid in data.get("personalTI", []):
        u = db.query(Usuario).filter(Usuario.id == uid).first()
        if u:
            reserva.personal_ti.append(u)

    # Registrar en historial
    db.add(HistorialAccion(
        reserva_id  = reserva.id,
        tipo_accion = TipoAccionEnum.CREADA,
        usuario     = usuario_nombre,
        descripcion = "Reserva creada desde el formulario",
    ))

    db.commit()
    db.refresh(reserva)
    return reserva
```

---

## 12. Dependencias de autenticación — `app/core/deps.py`

```python
# app/core/deps.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session    import SessionLocal
from app.core.security import decode_token
from app.crud import usuario as crud_usuario

bearer = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user = crud_usuario.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

def require_admin(current_user=Depends(get_current_user)):
    if current_user.rol != "ADMINISTRADOR":
        raise HTTPException(status_code=403, detail="Se requiere rol ADMINISTRADOR")
    return current_user
```

---

## 13. Cómo correr el proyecto

```bash
# 1. Clonar el repositorio y entrar a la carpeta
git clone <url-del-repo>
cd gra-backend

# 2. Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / Mac

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Crear el archivo .env (copiar el ejemplo y completar)
copy .env.example .env         # Windows
# cp .env.example .env         # Linux / Mac

# 5. Iniciar el servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Al arrancar por primera vez:
- Se crea automáticamente el archivo `gra.db` en la raíz del proyecto
- Se crean todas las tablas
- Se insertan los 4 auditorios y 3 usuarios base (gracias a `init_db.py`)

**No hay paso de `createdb` ni migraciones manuales** — SQLite lo hace todo solo.

El servidor queda en `http://localhost:8000`.

| URL | Descripción |
|---|---|
| `http://localhost:8000/docs` | **Swagger UI** — probar endpoints directamente en el navegador |
| `http://localhost:8000/redoc` | Documentación alternativa más legible |
| `http://localhost:8000/` | Health check |

---

## 14. Conectar el frontend con el backend

Solo hay **un cambio** en el frontend. Editar `src/api/axiosInstance.js` línea 4:

```js
// Antes:
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',

// Después:
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
```

O crear el archivo `gra-frontend/.env.local` (no requiere tocar código):
```env
VITE_API_URL=http://localhost:8000/api
```

El frontend ya tiene todo lo demás listo:
- JWT se adjunta automáticamente en cada petición
- Redirige a `/login` si el token expira (error 401)
- Todos los endpoints ya están definidos en `src/api/`

---

## 15. Pruebas con Postman

### Paso 1 — Crear el entorno `GRA Dev`
En Postman → Environments → New:

| Variable | Valor inicial |
|---|---|
| `base_url` | `http://localhost:8000/api` |
| `token` | *(dejar vacío)* |

### Paso 2 — Login con captura automática del token
Crear `POST {{base_url}}/auth/login`:
```json
{ "usuario": "lindelia", "contrasena": "1234" }
```
En la pestaña **Tests** de esa request:
```javascript
const resp = pm.response.json();
pm.environment.set("token", resp.token);
pm.test("Login exitoso", () => pm.response.to.have.status(200));
```
Desde este momento, ejecutar primero el login y el token queda guardado para todos los demás requests.

### Paso 3 — Configurar autenticación global
En la Collection → Authorization:
- Type: `Bearer Token`
- Token: `{{token}}`

Todos los requests heredan esta configuración automáticamente.

### Paso 4 — Colección recomendada

```
📁 GRA API
  📁 Auth
    POST  {{base_url}}/auth/login
  📁 Reservas
    GET   {{base_url}}/reservas
    GET   {{base_url}}/reservas?fecha=2026-05-17&estado=CONFIRMADA
    GET   {{base_url}}/reservas/1
    POST  {{base_url}}/reservas
    PUT   {{base_url}}/reservas/1
    DELETE {{base_url}}/reservas/1
    GET   {{base_url}}/reservas/1/historial
  📁 Auditorios
    GET   {{base_url}}/auditorios
    GET   {{base_url}}/auditorios/2/disponibilidad?fecha=2026-05-20&hora_inicio=09:00&hora_fin=11:00
    POST  {{base_url}}/auditorios
    PUT   {{base_url}}/auditorios/1
  📁 Usuarios
    GET   {{base_url}}/usuarios
    POST  {{base_url}}/usuarios
    PUT   {{base_url}}/usuarios/2
  📁 Historial
    GET   {{base_url}}/historial
    GET   {{base_url}}/historial?tipo=CREADA&desde=2026-05-01
  📁 Reportes
    GET   {{base_url}}/reportes/resumen?desde=2026-05-01&hasta=2026-05-31
    GET   {{base_url}}/reportes/exportar?desde=2026-05-01&hasta=2026-05-31
```

### Paso 5 — Bodies de ejemplo

**Crear reserva — Rodrigo Rivera con secciones:**
```json
{
  "fecha": "2026-05-20",
  "horaInicio": "09:00",
  "horaFin": "11:00",
  "auditorioId": 2,
  "encargado": "Carlos Pérez",
  "facultad": "Ingeniería",
  "tipoEvento": "Taller",
  "nombreEvento": "Taller de programación",
  "descripcion": "Grupos pequeños — solo parte del auditorio",
  "personas": 16,
  "equipos": ["Proyector"],
  "personalTI": [2],
  "secciones": ["SI", "SD"]
}
```

**Crear reserva — Benjamín Herrera sala completa:**
```json
{
  "fecha": "2026-05-21",
  "horaInicio": "08:00",
  "horaFin": "10:00",
  "auditorioId": 1,
  "encargado": "Lindelia González",
  "facultad": "Derecho",
  "tipoEvento": "Charla académica",
  "nombreEvento": "Conferencia de grado",
  "personas": 90,
  "equipos": ["Proyector", "Micrófono", "Cámaras"],
  "personalTI": [2, 3],
  "secciones": []
}
```

### Paso 6 — Verificar CORS
Si el frontend lanza errores `CORS policy` en la consola del navegador (F12 → Network),
verificar que `allow_origins` en `main.py` incluya exactamente la URL donde corre el frontend
(puede ser `http://localhost:3000` o `http://localhost:3001`).

---

## 16. Resumen de todos los endpoints

| Método | Ruta | Auth | Rol mínimo | Descripción |
|--------|------|:----:|------------|-------------|
| POST | `/api/auth/login` | No | — | Iniciar sesión, recibe JWT |
| GET | `/api/reservas` | Sí | PERSONAL_TI | Listar con filtros y paginación |
| GET | `/api/reservas/{id}` | Sí | PERSONAL_TI | Detalle de una reserva |
| POST | `/api/reservas` | Sí | ADMINISTRADOR | Crear reserva |
| PUT | `/api/reservas/{id}` | Sí | ADMINISTRADOR | Editar reserva |
| DELETE | `/api/reservas/{id}` | Sí | ADMINISTRADOR | Cancelar reserva (soft delete) |
| GET | `/api/reservas/{id}/historial` | Sí | PERSONAL_TI | Historial de cambios |
| GET | `/api/auditorios` | Sí | PERSONAL_TI | Listar auditorios y secciones |
| GET | `/api/auditorios/{id}/disponibilidad` | Sí | PERSONAL_TI | Verificar horario libre |
| POST | `/api/auditorios` | Sí | ADMINISTRADOR | Crear auditorio |
| PUT | `/api/auditorios/{id}` | Sí | ADMINISTRADOR | Editar auditorio |
| GET | `/api/usuarios` | Sí | ADMINISTRADOR | Listar personal |
| POST | `/api/usuarios` | Sí | ADMINISTRADOR | Crear usuario |
| PUT | `/api/usuarios/{id}` | Sí | ADMINISTRADOR | Editar usuario |
| GET | `/api/historial` | Sí | ADMINISTRADOR | Historial general del sistema |
| GET | `/api/reportes/resumen` | Sí | ADMINISTRADOR | Datos para las gráficas |
| GET | `/api/reportes/exportar` | Sí | ADMINISTRADOR | Descargar reporte Excel |
| **POST** | **`/api/solicitudes-externas`** | **No** | **— (público)** | **Enviar solicitud desde formulario externo** |
| **GET** | **`/api/solicitudes-externas`** | **Sí** | **ADMINISTRADOR** | **Listar solicitudes con filtros** |
| **GET** | **`/api/solicitudes-externas/{id}`** | **Sí** | **ADMINISTRADOR** | **Detalle de una solicitud** |
| **PATCH** | **`/api/solicitudes-externas/{id}/aprobar`** | **Sí** | **ADMINISTRADOR** | **Aprobar y fijar tarifa** |
| **PATCH** | **`/api/solicitudes-externas/{id}/rechazar`** | **Sí** | **ADMINISTRADOR** | **Rechazar con motivo** |
| **PATCH** | **`/api/solicitudes-externas/{id}/pago`** | **Sí** | **ADMINISTRADOR** | **Registrar estado del cobro** |

---

---

## 17. ★ Módulo de Solicitudes por Entidades Externas

> Añadido en la iteración 2 del prototipo. Permite que colegios, empresas u otras
> organizaciones soliciten la reserva de un auditorio sin necesidad de tener cuenta
> en el sistema. El administrador revisa, aprueba o rechaza cada solicitud y registra
> el estado del cobro.

### Flujo completo

```
Entidad externa                Admin (panel interno)
──────────────                 ─────────────────────
GET  /solicitud-externa   →    formulario público (React, sin auth)
POST /api/solicitudes-externas ← envío del formulario
                               GET  /api/solicitudes-externas   (lista con filtros)
                               GET  /api/solicitudes-externas/{id}
                               PATCH /api/solicitudes-externas/{id}/aprobar
                               PATCH /api/solicitudes-externas/{id}/rechazar
                               PATCH /api/solicitudes-externas/{id}/pago
```

---

### Modelo — `app/models/solicitud_externa.py`

```python
from sqlalchemy import Column, Integer, String, Date, Time, Enum, Numeric, DateTime
from app.db.base  import Base
from app.db.types import JSONList
from datetime     import datetime
import enum

class EstadoSolicitudEnum(str, enum.Enum):
    PENDIENTE  = "PENDIENTE"
    APROBADA   = "APROBADA"
    RECHAZADA  = "RECHAZADA"
    CANCELADA  = "CANCELADA"

class EstadoPagoEnum(str, enum.Enum):
    PENDIENTE_PAGO = "PENDIENTE_PAGO"
    PAGADO         = "PAGADO"
    EXENTO         = "EXENTO"

class SolicitudExterna(Base):
    __tablename__ = "solicitudes_externas"

    id               = Column(String(20),  primary_key=True)   # ej: "SE-001"
    # ── Datos de la entidad ──────────────────────────────────────────────────
    nombre_entidad   = Column(String(200), nullable=True)   # null si persona natural
    tipo_entidad     = Column(String(80),  nullable=False)
    nit              = Column(String(20),  nullable=True)   # null si persona natural
    nombre_contacto  = Column(String(150), nullable=False)
    cargo_contacto   = Column(String(100), nullable=False)
    correo_contacto  = Column(String(150), nullable=False)
    telefono_contacto= Column(String(20),  nullable=False)
    # ── Datos del evento ─────────────────────────────────────────────────────
    sede             = Column(String(20),  nullable=False)   # "CENTRO" | "BELMONTE"
    auditorio_id     = Column(Integer,     nullable=False)
    fecha            = Column(Date,        nullable=False)
    hora_inicio      = Column(Time,        nullable=False)
    hora_fin         = Column(Time,        nullable=False)
    nombre_evento    = Column(String(200), nullable=False)
    tipo_evento      = Column(String(80),  nullable=False)
    descripcion_evento= Column(String(600), nullable=False)
    num_asistentes   = Column(Integer,     nullable=False)
    requiere_equipos = Column(JSONList,    default=list)  # ej: ["Proyector","Micrófono"]
    # ── Control administrativo ───────────────────────────────────────────────
    estado           = Column(Enum(EstadoSolicitudEnum),
                               default=EstadoSolicitudEnum.PENDIENTE)
    estado_pago      = Column(Enum(EstadoPagoEnum),
                               default=EstadoPagoEnum.PENDIENTE_PAGO)
    tarifa_aplicada  = Column(Numeric(12, 2), nullable=True)
    referencia_pago  = Column(String(50),  nullable=True)
    nota_admin       = Column(String(300), nullable=True)
    motivo_rechazo   = Column(String(300), nullable=True)
    fecha_solicitud  = Column(DateTime,    default=datetime.utcnow, index=True)
```

> **ID autoincremental:** generar el ID secuencial con el prefijo `SE-` en el CRUD:
> ```python
> ultimo = db.query(SolicitudExterna).order_by(
>     SolicitudExterna.fecha_solicitud.desc()
> ).first()
> num = int(ultimo.id.split("-")[1]) + 1 if ultimo else 1
> nueva_id = f"SE-{str(num).zfill(3)}"
> ```

---

### Schemas — `app/schemas/solicitud_externa.py`

```python
from pydantic   import BaseModel, EmailStr
from typing     import List, Optional
from datetime   import date, time, datetime
from decimal    import Decimal

# ── Entrada (POST público) ────────────────────────────────────────────────────
class SolicitudExternaCreate(BaseModel):
    nombreEntidad:    Optional[str] = None
    tipoEntidad:      str
    nit:              Optional[str] = None
    nombreContacto:   str
    cargoContacto:    str
    correoContacto:   EmailStr
    telefonoContacto: str
    sede:             str
    auditorioId:      int
    fecha:            date
    horaInicio:       str   # "HH:MM"
    horaFin:          str
    nombreEvento:     str
    tipoEvento:       str
    descripcionEvento: str
    numAsistentes:    int
    requiereEquipos:  List[str] = []

# ── Salida (GET) ──────────────────────────────────────────────────────────────
class SolicitudExternaOut(SolicitudExternaCreate):
    id:              str
    auditorio:       str              # nombre del auditorio (join)
    estado:          str
    estadoPago:      str
    tarifaAplicada:  Optional[Decimal] = None
    referenciaPago:  Optional[str]     = None
    notaAdmin:       Optional[str]     = None
    motivoRechazo:   Optional[str]     = None
    fechaSolicitud:  datetime

    class Config:
        from_attributes = True

# ── Acción: aprobar ───────────────────────────────────────────────────────────
class AprobarSolicitud(BaseModel):
    tarifaAplicada: Decimal
    notaAdmin:      Optional[str] = None

# ── Acción: rechazar ──────────────────────────────────────────────────────────
class RechazarSolicitud(BaseModel):
    motivo: str

# ── Acción: registrar pago ────────────────────────────────────────────────────
class RegistrarPago(BaseModel):
    estadoPago:     str   # "PAGADO" | "PENDIENTE_PAGO" | "EXENTO"
    referenciaPago: Optional[str] = None
```

---

### Router — `app/routers/solicitudes_externas.py`

```python
# app/routers/solicitudes_externas.py
from fastapi    import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing     import Optional
from app.core.deps   import get_db, require_admin
from app.models.solicitud_externa import SolicitudExterna, EstadoSolicitudEnum, EstadoPagoEnum
from app.models.auditorio         import Auditorio
from app.schemas.solicitud_externa import (
    SolicitudExternaCreate, SolicitudExternaOut,
    AprobarSolicitud, RechazarSolicitud, RegistrarPago,
)
from datetime import datetime

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# POST /solicitudes-externas  ← PÚBLICO, sin autenticación
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", status_code=201)
def crear_solicitud(data: SolicitudExternaCreate, db: Session = Depends(get_db)):
    """
    Endpoint público. Recibe el formulario de la entidad externa.
    No requiere token JWT.
    """
    # Verificar que el auditorio existe y está activo
    auditorio = db.query(Auditorio).filter(
        Auditorio.id == data.auditorioId,
        Auditorio.estado == "ACTIVO",
    ).first()
    if not auditorio:
        raise HTTPException(status_code=404, detail="Auditorio no encontrado o inactivo")

    # Generar ID secuencial SE-001, SE-002 ...
    ultimo = db.query(SolicitudExterna).order_by(
        SolicitudExterna.fecha_solicitud.desc()
    ).first()
    num      = int(ultimo.id.split("-")[1]) + 1 if ultimo else 1
    nueva_id = f"SE-{str(num).zfill(3)}"

    solicitud = SolicitudExterna(
        id                = nueva_id,
        nombre_entidad    = data.nombreEntidad,
        tipo_entidad      = data.tipoEntidad,
        nit               = data.nit,
        nombre_contacto   = data.nombreContacto,
        cargo_contacto    = data.cargoContacto,
        correo_contacto   = data.correoContacto,
        telefono_contacto = data.telefonoContacto,
        sede              = data.sede.upper(),
        auditorio_id      = data.auditorioId,
        fecha             = data.fecha,
        hora_inicio       = data.horaInicio,
        hora_fin          = data.horaFin,
        nombre_evento     = data.nombreEvento,
        tipo_evento       = data.tipoEvento,
        descripcion_evento= data.descripcionEvento,
        num_asistentes    = data.numAsistentes,
        requiere_equipos  = data.requiereEquipos,
        fecha_solicitud   = datetime.utcnow(),
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return {"id": solicitud.id}


# ─────────────────────────────────────────────────────────────────────────────
# GET /solicitudes-externas  ← ADMIN
# ─────────────────────────────────────────────────────────────────────────────
@router.get("", response_model=list[SolicitudExternaOut])
def listar_solicitudes(
    estado:      Optional[str] = Query(None),
    sede:        Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    db:          Session = Depends(get_db),
    _admin =     Depends(require_admin),
):
    q = db.query(SolicitudExterna)
    if estado:      q = q.filter(SolicitudExterna.estado == estado.upper())
    if sede:        q = q.filter(SolicitudExterna.sede   == sede.upper())
    if fecha_desde: q = q.filter(SolicitudExterna.fecha  >= fecha_desde)
    if fecha_hasta: q = q.filter(SolicitudExterna.fecha  <= fecha_hasta)

    solicitudes = q.order_by(SolicitudExterna.fecha_solicitud.desc()).all()

    # Enriquecer con nombre del auditorio (join manual para simplicidad)
    resultado = []
    for s in solicitudes:
        aud = db.query(Auditorio).filter(Auditorio.id == s.auditorio_id).first()
        item = SolicitudExternaOut.model_validate(s)
        item.auditorio  = aud.nombre if aud else "—"
        item.horaInicio = str(s.hora_inicio)[:5]
        item.horaFin    = str(s.hora_fin)[:5]
        resultado.append(item)
    return resultado


# ─────────────────────────────────────────────────────────────────────────────
# GET /solicitudes-externas/{id}  ← ADMIN
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{solicitud_id}", response_model=SolicitudExternaOut)
def obtener_solicitud(
    solicitud_id: str,
    db:    Session = Depends(get_db),
    _admin =       Depends(require_admin),
):
    s = db.query(SolicitudExterna).filter(SolicitudExterna.id == solicitud_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    aud  = db.query(Auditorio).filter(Auditorio.id == s.auditorio_id).first()
    item = SolicitudExternaOut.model_validate(s)
    item.auditorio  = aud.nombre if aud else "—"
    item.horaInicio = str(s.hora_inicio)[:5]
    item.horaFin    = str(s.hora_fin)[:5]
    return item


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /solicitudes-externas/{id}/aprobar  ← ADMIN
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/{solicitud_id}/aprobar")
def aprobar_solicitud(
    solicitud_id: str,
    datos: AprobarSolicitud,
    db:    Session = Depends(get_db),
    _admin =       Depends(require_admin),
):
    s = db.query(SolicitudExterna).filter(SolicitudExterna.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado != EstadoSolicitudEnum.PENDIENTE:
        raise HTTPException(400, f"No se puede aprobar una solicitud en estado {s.estado}")

    s.estado          = EstadoSolicitudEnum.APROBADA
    s.tarifa_aplicada = datos.tarifaAplicada
    s.nota_admin      = datos.notaAdmin
    db.commit()
    return {"ok": True}


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /solicitudes-externas/{id}/rechazar  ← ADMIN
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/{solicitud_id}/rechazar")
def rechazar_solicitud(
    solicitud_id: str,
    datos: RechazarSolicitud,
    db:    Session = Depends(get_db),
    _admin =       Depends(require_admin),
):
    s = db.query(SolicitudExterna).filter(SolicitudExterna.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado != EstadoSolicitudEnum.PENDIENTE:
        raise HTTPException(400, f"No se puede rechazar una solicitud en estado {s.estado}")

    s.estado          = EstadoSolicitudEnum.RECHAZADA
    s.motivo_rechazo  = datos.motivo
    db.commit()
    return {"ok": True}


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /solicitudes-externas/{id}/pago  ← ADMIN
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/{solicitud_id}/pago")
def registrar_pago(
    solicitud_id: str,
    datos: RegistrarPago,
    db:    Session = Depends(get_db),
    _admin =       Depends(require_admin),
):
    s = db.query(SolicitudExterna).filter(SolicitudExterna.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado != EstadoSolicitudEnum.APROBADA:
        raise HTTPException(400, "Solo se puede registrar el pago en solicitudes aprobadas")

    s.estado_pago     = datos.estadoPago
    s.referencia_pago = datos.referenciaPago
    db.commit()
    return {"ok": True}
```

---

### Registrar el nuevo router en `app/main.py`

Agregar la importación y el `include_router`:

```python
# app/main.py  — agregar estas dos líneas a las ya existentes

from app.routers import solicitudes_externas   # ← nueva importación

# dentro de la sección de routers:
app.include_router(
    solicitudes_externas.router,
    prefix="/api/solicitudes-externas",
    tags=["Solicitudes Externas"],
)
```

> ⚠️ **Importante — endpoint público:** El `POST /api/solicitudes-externas` no lleva
> `Depends(require_admin)` ni `Depends(get_current_user)`, por lo que cualquier persona
> puede enviarlo sin token. Asegurarse de **no** aplicar un middleware global de auth a
> este router. El resto de los endpoints del mismo router sí requieren admin.

---

### Contratos de API — Solicitudes Externas

#### `POST /api/solicitudes-externas` — **Público, sin token**
**Body (camelCase, igual que lo envía el formulario React):**
```json
{
  "nombreEntidad":    "Colegio Técnico Empresarial",
  "tipoEntidad":      "Institución educativa",
  "nit":              "800987654-3",
  "nombreContacto":   "María Fernanda Ospina",
  "cargoContacto":    "Coordinadora académica",
  "correoContacto":   "mospina@cteempresarial.edu.co",
  "telefonoContacto": "3124567890",
  "sede":             "Centro",
  "auditorioId":      1,
  "fecha":            "2026-06-10",
  "horaInicio":       "09:00",
  "horaFin":          "12:00",
  "nombreEvento":     "Feria de orientación vocacional",
  "tipoEvento":       "Evento cultural",
  "descripcionEvento": "Descripción detallada del evento con al menos 30 caracteres.",
  "numAsistentes":    80,
  "requiereEquipos":  ["Proyector", "Micrófono"]
}
```
> Para **persona natural**: omitir `nombreEntidad` y `nit` (ambos `null`).

**Respuesta 201:**
```json
{ "id": "SE-001" }
```
**Error 404:** `{ "detail": "Auditorio no encontrado o inactivo" }`

---

#### `GET /api/solicitudes-externas` — requiere `ADMINISTRADOR`
**Query params (todos opcionales):**
```
estado=PENDIENTE        → filtra por estado
sede=CENTRO
fecha_desde=2026-06-01
fecha_hasta=2026-06-30
```
**Respuesta 200:** array de objetos `SolicitudExternaOut`
```json
[
  {
    "id": "SE-001",
    "nombreEntidad":   "Colegio Técnico Empresarial",
    "tipoEntidad":     "Institución educativa",
    "nit":             "800987654-3",
    "nombreContacto":  "María Fernanda Ospina",
    "cargoContacto":   "Coordinadora académica",
    "correoContacto":  "mospina@cteempresarial.edu.co",
    "telefonoContacto":"3124567890",
    "sede":            "CENTRO",
    "auditorioId":     1,
    "auditorio":       "Benjamín Herrera",
    "fecha":           "2026-06-10",
    "horaInicio":      "09:00",
    "horaFin":         "12:00",
    "nombreEvento":    "Feria de orientación vocacional",
    "tipoEvento":      "Evento cultural",
    "descripcionEvento": "Descripción del evento...",
    "numAsistentes":   80,
    "requiereEquipos": ["Proyector", "Micrófono"],
    "estado":          "PENDIENTE",
    "estadoPago":      "PENDIENTE_PAGO",
    "tarifaAplicada":  null,
    "referenciaPago":  null,
    "notaAdmin":       null,
    "motivoRechazo":   null,
    "fechaSolicitud":  "2026-05-19T10:30:00"
  }
]
```

---

#### `GET /api/solicitudes-externas/{id}` — requiere `ADMINISTRADOR`
**Respuesta 200:** mismo objeto que un ítem del listado  
**Error 404:** `{ "detail": "Solicitud no encontrada" }`

---

#### `PATCH /api/solicitudes-externas/{id}/aprobar` — requiere `ADMINISTRADOR`
**Body:**
```json
{ "tarifaAplicada": 850000, "notaAdmin": "Tarifa estándar para entidades educativas." }
```
**Respuesta 200:** `{ "ok": true }`  
**Error 400:** si la solicitud no está en estado `PENDIENTE`

---

#### `PATCH /api/solicitudes-externas/{id}/rechazar` — requiere `ADMINISTRADOR`
**Body:**
```json
{ "motivo": "El auditorio ya tiene una reserva confirmada para esa fecha." }
```
**Respuesta 200:** `{ "ok": true }`  
**Error 400:** si la solicitud no está en estado `PENDIENTE`

---

#### `PATCH /api/solicitudes-externas/{id}/pago` — requiere `ADMINISTRADOR`
**Body:**
```json
{ "estadoPago": "PAGADO", "referenciaPago": "REC-2026-0412" }
```
> `estadoPago`: `"PAGADO"` | `"PENDIENTE_PAGO"` | `"EXENTO"`  
> `referenciaPago`: obligatorio solo si `estadoPago = "PAGADO"`

**Respuesta 200:** `{ "ok": true }`  
**Error 400:** si la solicitud no está en estado `APROBADA`

---

### Colección Postman — Solicitudes Externas

Agregar a la colección existente `GRA API`:

```
📁 Solicitudes Externas
  POST  {{base_url}}/solicitudes-externas              ← sin Auth (público)
  GET   {{base_url}}/solicitudes-externas
  GET   {{base_url}}/solicitudes-externas?estado=PENDIENTE
  GET   {{base_url}}/solicitudes-externas?sede=CENTRO&fecha_desde=2026-06-01
  GET   {{base_url}}/solicitudes-externas/SE-001
  PATCH {{base_url}}/solicitudes-externas/SE-001/aprobar
  PATCH {{base_url}}/solicitudes-externas/SE-001/rechazar
  PATCH {{base_url}}/solicitudes-externas/SE-001/pago
```

> **Para el `POST` público:** en Postman, ir a la pestaña **Authorization** de esa
> request específica y seleccionar **No Auth** (anula la herencia del Bearer global).

---

## 18. Migración a PostgreSQL (cuando se apruebe el prototipo)

Cuando el proyecto pase a producción, el proceso de migrar de SQLite a PostgreSQL
requiere exactamente **3 pasos**:

### Paso 1 — Instalar el driver de PostgreSQL
```bash
pip install psycopg2-binary
pip freeze > requirements.txt
```

### Paso 2 — Cambiar una línea en `.env`
```env
# Antes (SQLite):
DATABASE_URL=sqlite:///./gra.db

# Después (PostgreSQL):
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/gra_db
```

### Paso 3 — Reemplazar `JSONList` por `ARRAY` en los modelos
En los 2 modelos que usan `JSONList`, hacer el cambio:

```python
# Antes (SQLite):
from app.db.types import JSONList
equipamiento = Column(JSONList, default=list)
secciones    = Column(JSONList, default=list)
equipos      = Column(JSONList, default=list)

# Después (PostgreSQL):
from sqlalchemy import ARRAY, String
equipamiento = Column(ARRAY(String), default=[])
secciones    = Column(ARRAY(String), default=[])
equipos      = Column(ARRAY(String), default=[])
```

### Nada más cambia
- Todo el código de routers, CRUD, schemas y autenticación es 100 % compatible
- El frontend no requiere ningún cambio
- Los datos del prototipo se pueden migrar con un script de exportación/importación si es necesario

---

---

*Documento generado para el equipo de backend — GRA v1.1 · Universidad Libre Seccional Pereira*  
*Base de datos: SQLite (fase prototipo) → PostgreSQL (fase producción)*  
*Última actualización: módulo Solicitudes por Entidades Externas (iteración 2)*
