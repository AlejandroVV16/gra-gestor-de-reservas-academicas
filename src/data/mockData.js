// Datos de ejemplo para el prototipo — reemplazar con llamadas reales al backend

// Secciones del auditorio Rodrigo Rivera (divisible en hasta 4 zonas)
export const SECCIONES_RODRIGO = [
  { id: 'SI', label: 'Superior Izquierda', capacidad: 8 },
  { id: 'SD', label: 'Superior Derecha',   capacidad: 8 },
  { id: 'II', label: 'Inferior Izquierda', capacidad: 7 },
  { id: 'ID', label: 'Inferior Derecha',   capacidad: 7 },
]

export const MOCK_AUDITORIOS = [
  { id: 1, nombre: 'Benjamín Herrera',  sede: 'CENTRO',   capacidad: 96, estado: 'ACTIVO',   equipamiento: ['Proyector', 'Micrófono', 'Cámaras'], descripcion: 'Auditorio principal del campus Centro', divisible: false },
  { id: 2, nombre: 'Rodrigo Rivera',    sede: 'CENTRO',   capacidad: 30, estado: 'ACTIVO',   equipamiento: ['Proyector', 'Micrófono'],            descripcion: 'Sala de conferencias — divisible en hasta 4 secciones independientes', divisible: true, secciones: SECCIONES_RODRIGO },
  { id: 3, nombre: 'Sala Auxiliar 1',   sede: 'CENTRO',   capacidad: 20, estado: 'ACTIVO',   equipamiento: ['Proyector'],                         descripcion: 'Sala auxiliar de reuniones', divisible: false },
  { id: 4, nombre: 'Sala de Sistemas 1',sede: 'BELMONTE', capacidad: 40, estado: 'INACTIVO', equipamiento: ['Proyector', 'Micrófono'],            descripcion: 'Laboratorio de sistemas Belmonte', divisible: false },
]

export const MOCK_USUARIOS = [
  { id: 1, nombre: 'Lindelia', apellido: 'González',  usuario: 'lindelia', correo: 'lindelia@unilibre.edu.co',   rol: 'ADMINISTRADOR', estado: 'ACTIVO',  ultimaConexion: '2026-05-16T15:22:00' },
  { id: 2, nombre: 'Johns',    apellido: 'Betancur',  usuario: 'johns',    correo: 'johns@unilibre.edu.co',      rol: 'PERSONAL_TI',   estado: 'ACTIVO',  ultimaConexion: '2026-05-16T12:35:00' },
  { id: 3, nombre: 'Alex',     apellido: 'Bedoya',    usuario: 'alex',     correo: 'alex@unilibre.edu.co',       rol: 'PERSONAL_TI',   estado: 'ACTIVO',  ultimaConexion: '2026-05-15T09:10:00' },
  { id: 4, nombre: 'Diana',    apellido: 'Henao',     usuario: 'diana',    correo: 'diana@unilibre.edu.co',      rol: 'PERSONAL_TI',   estado: 'INACTIVO',ultimaConexion: '2026-04-30T16:00:00' },
]

export const MOCK_RESERVAS = [
  { id: 1,  horaInicio: '09:00', horaFin: '11:00', encargado: 'Lindelia',   facultad: 'Ingeniería',        auditorio: 'Benjamín Herrera',   evento: 'Charla académica',           personas: 80, personalTI: [MOCK_USUARIOS[1]], estado: 'CONFIRMADA', fecha: '2026-05-16' },
  { id: 2,  horaInicio: '11:00', horaFin: '13:00', encargado: 'Carlos E.',  facultad: 'Ciencias de Salud', auditorio: 'Rodrigo Rivera',     evento: 'Reunión de programas',       personas: 25, personalTI: [MOCK_USUARIOS[2]], estado: 'PENDIENTE',  fecha: '2026-05-16' },
  { id: 3,  horaInicio: '14:00', horaFin: '16:00', encargado: 'Lindelia',   facultad: 'Ingeniería',        auditorio: 'Benjamín Herrera',   evento: 'Clase portafolio financiero',personas: 60, personalTI: [MOCK_USUARIOS[1]], estado: 'CONFIRMADA', fecha: '2026-05-16' },
  { id: 4,  horaInicio: '07:00', horaFin: '09:00', encargado: 'Sindy V.',   facultad: 'Ciencias de Salud', auditorio: 'Sala Auxiliar 1',    evento: 'Parcial',                    personas: 18, personalTI: [],                 estado: 'CONFIRMADA', fecha: '2026-05-17' },
  { id: 5,  horaInicio: '08:00', horaFin: '10:00', encargado: 'Javier P.',  facultad: 'Ingeniería',        auditorio: 'Rodrigo Rivera',     evento: 'Taller fortalecimiento',     personas: 28, personalTI: [MOCK_USUARIOS[2]], estado: 'PENDIENTE',  fecha: '2026-05-17' },
  { id: 6,  horaInicio: '10:00', horaFin: '12:00', encargado: 'Laura T.',   facultad: 'Ingeniería',        auditorio: 'Benjamín Herrera',   evento: 'Evaluación enzimas',         personas: 55, personalTI: [MOCK_USUARIOS[1]], estado: 'CONFIRMADA', fecha: '2026-05-17' },
  { id: 7,  horaInicio: '13:00', horaFin: '15:00', encargado: 'Eloy A.',    facultad: 'Ciencias de Salud', auditorio: 'Sala Auxiliar 1',    evento: 'Inducción enfermería',       personas: 20, personalTI: [],                 estado: 'CANCELADA',  fecha: '2026-05-17' },
  { id: 8,  horaInicio: '15:00', horaFin: '17:00', encargado: 'Carlos E.',  facultad: 'Ingeniería',        auditorio: 'Rodrigo Rivera',     evento: 'Grupo investigación',        personas: 15, personalTI: [MOCK_USUARIOS[2]], estado: 'CONFLICTO',  fecha: '2026-05-18' },
]

export const MOCK_HISTORIAL = [
  { id: 1, fechaHora: '2026-05-16T08:30:00', reservaId: 1, reservaNombre: 'Charla académica',       auditorio: 'Benjamín Herrera', tipoAccion: 'CREADA',    usuario: 'Lindelia',  descripcion: 'Reserva creada desde el formulario principal'   },
  { id: 2, fechaHora: '2026-05-16T09:15:00', reservaId: 2, reservaNombre: 'Reunión de programas',   auditorio: 'Rodrigo Rivera',   tipoAccion: 'EDITADA',   usuario: 'Lindelia',  descripcion: 'Cambio de hora inicio: 10:00 → 11:00'           },
  { id: 3, fechaHora: '2026-05-15T14:00:00', reservaId: 7, reservaNombre: 'Inducción enfermería',   auditorio: 'Sala Auxiliar 1',  tipoAccion: 'CANCELADA', usuario: 'Lindelia',  descripcion: 'Cancelada por solicitud del encargado'          },
  { id: 4, fechaHora: '2026-05-15T11:20:00', reservaId: 8, reservaNombre: 'Grupo investigación',    auditorio: 'Rodrigo Rivera',   tipoAccion: 'CONFLICTO_RESUELTO', usuario: 'Lindelia', descripcion: 'Conflicto con reserva #5 resuelto manualmente' },
  { id: 5, fechaHora: '2026-05-14T16:45:00', reservaId: 3, reservaNombre: 'Clase portafolio',       auditorio: 'Benjamín Herrera', tipoAccion: 'CREADA',    usuario: 'Johns',     descripcion: 'Creada por personal TI'                         },
]

export const MOCK_FACULTADES = [
  'Ingeniería', 'Ciencias de la Salud', 'Derecho', 'Ciencias Económicas', 'Ciencias Educación',
]

export const MOCK_TIPOS_EVENTO = [
  'Charla académica', 'Examen / Parcial', 'Reunión institucional', 'Taller', 'Conferencia', 'Clase especial', 'Otro',
]

export const MOCK_SOLICITUDES_EXTERNAS = [
  {
    id: 'SE-001',
    nombreEntidad: 'Colegio Técnico Empresarial',
    tipoEntidad: 'Institución educativa',
    nit: '800987654-3',
    nombreContacto: 'María Fernanda Ospina',
    cargoContacto: 'Coordinadora académica',
    correoContacto: 'mospina@cteempresarial.edu.co',
    telefonoContacto: '3124567890',
    sede: 'CENTRO',
    auditorioId: 1,
    auditorio: 'Benjamín Herrera',
    fecha: '2026-06-10',
    horaInicio: '09:00',
    horaFin: '12:00',
    nombreEvento: 'Feria de orientación vocacional',
    tipoEvento: 'Evento cultural',
    descripcionEvento: 'Feria de orientación para estudiantes de grado 11 con participación de universidades de la región.',
    numAsistentes: 80,
    requiereEquipos: ['Proyector', 'Micrófono'],
    estado: 'PENDIENTE',
    estadoPago: 'PENDIENTE_PAGO',
    tarifaAplicada: null,
    referenciaPago: null,
    notaAdmin: null,
    fechaSolicitud: '2026-05-19T10:30:00',
  },
  {
    id: 'SE-002',
    nombreEntidad: 'Cámara de Comercio de Pereira',
    tipoEntidad: 'Entidad pública',
    nit: '891480014-7',
    nombreContacto: 'Andrés Felipe Morales',
    cargoContacto: 'Gerente de eventos',
    correoContacto: 'amorales@camarapereira.org.co',
    telefonoContacto: '3209876543',
    sede: 'CENTRO',
    auditorioId: 1,
    auditorio: 'Benjamín Herrera',
    fecha: '2026-06-15',
    horaInicio: '14:00',
    horaFin: '18:00',
    nombreEvento: 'Foro empresarial Risaralda 2026',
    tipoEvento: 'Conferencia',
    descripcionEvento: 'Foro anual de empresarios del Eje Cafetero con ponentes nacionales e internacionales.',
    numAsistentes: 90,
    requiereEquipos: ['Proyector', 'Micrófono', 'Cámaras'],
    estado: 'APROBADA',
    estadoPago: 'PAGADO',
    tarifaAplicada: 850000,
    referenciaPago: 'REC-2026-0412',
    notaAdmin: 'Entidad con historial de pagos puntual. Tarifa estándar aplicada.',
    fechaSolicitud: '2026-05-10T08:00:00',
  },
]
