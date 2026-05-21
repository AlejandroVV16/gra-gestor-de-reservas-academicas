import { useState, useEffect } from 'react'
import { Building2, User, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { crearSolicitudExterna } from '../api/solicitudesExternasApi'
import { MOCK_AUDITORIOS } from '../data/mockData'
import escudo from '../resources/escudo-unilibre.png.png'

// ── Constantes de dominio ────────────────────────────────────────────────────

const TIPOS_ENTIDAD = [
  'Institución educativa',
  'Empresa privada',
  'Entidad pública',
  'ONG / Fundación',
  'Persona natural',
  'Otro',
]

const SEDES = ['Centro', 'Belmonte']

const TIPOS_EVENTO = [
  'Conferencia',
  'Seminario',
  'Capacitación',
  'Graduación',
  'Evento cultural',
  'Otro',
]

const EQUIPOS_OPCIONES = ['Proyector', 'Micrófono', 'Cámaras', 'Sillas adicionales']

// Franjas de 30 minutos 07:00–20:00
const FRANJAS_HORA = (() => {
  const slots = []
  for (let h = 7; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})()

// ── Validadores ──────────────────────────────────────────────────────────────

const RE_NIT = /^\d{6,10}-\d{1}$/
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_TEL = /^[0-9]{7,15}$/

function minutosDesde7(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function validarCampos(f, esPersonaNatural, auditorio) {
  const errs = {}

  if (!f.nombreContacto.trim()) errs.nombreContacto = 'Campo requerido'
  if (!f.cargoContacto.trim()) errs.cargoContacto = 'Campo requerido'
  if (!f.correoContacto.trim()) errs.correoContacto = 'Campo requerido'
  else if (!RE_EMAIL.test(f.correoContacto)) errs.correoContacto = 'Correo inválido'
  if (!f.telefonoContacto.trim()) errs.telefonoContacto = 'Campo requerido'
  else if (!RE_TEL.test(f.telefonoContacto)) errs.telefonoContacto = 'Solo números, 7–15 dígitos'

  if (!esPersonaNatural) {
    if (!f.nombreEntidad.trim()) errs.nombreEntidad = 'Campo requerido'
    if (!f.tipoEntidad) errs.tipoEntidad = 'Seleccione un tipo'
    if (!f.nit.trim()) errs.nit = 'Campo requerido'
    else if (!RE_NIT.test(f.nit)) errs.nit = 'Formato inválido. Ej: 900123456-7'
  }

  if (!f.sede) errs.sede = 'Seleccione una sede'
  if (!f.auditorioId) errs.auditorioId = 'Seleccione un auditorio'
  if (!f.fecha) errs.fecha = 'Campo requerido'
  else {
    const d = new Date(f.fecha + 'T00:00:00')
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    if (d < hoy) errs.fecha = 'No se permiten fechas pasadas'
    else if (d.getDay() === 0) errs.fecha = 'No se permiten domingos'
  }
  if (!f.horaInicio) errs.horaInicio = 'Campo requerido'
  if (!f.horaFin) errs.horaFin = 'Campo requerido'
  else if (f.horaInicio && minutosDesde7(f.horaFin) - minutosDesde7(f.horaInicio) < 60) {
    errs.horaFin = 'Mínimo 1 hora después de la hora de inicio'
  }
  if (!f.nombreEvento.trim()) errs.nombreEvento = 'Campo requerido'
  if (!f.tipoEvento) errs.tipoEvento = 'Seleccione un tipo'
  if (!f.descripcionEvento.trim()) errs.descripcionEvento = 'Campo requerido'
  else if (f.descripcionEvento.trim().length < 30) errs.descripcionEvento = 'Mínimo 30 caracteres'
  if (!f.numAsistentes) errs.numAsistentes = 'Campo requerido'
  else if (auditorio && Number(f.numAsistentes) > auditorio.capacidad) {
    errs.numAsistentes = `Excede la capacidad del auditorio (${auditorio.capacidad} personas)`
  }

  return errs
}

// ── Estado inicial del formulario ────────────────────────────────────────────

const FORM_INICIAL = {
  nombreEntidad: '',
  tipoEntidad: '',
  nit: '',
  nombreContacto: '',
  cargoContacto: '',
  correoContacto: '',
  telefonoContacto: '',
  sede: '',
  auditorioId: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  nombreEvento: '',
  tipoEvento: '',
  descripcionEvento: '',
  numAsistentes: '',
  requiereEquipos: [],
}

// ── Componentes auxiliares ───────────────────────────────────────────────────

function Campo({ id, label, error, children, opcional }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {opcional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-[#C8171E]">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

function Input({ id, error, ...props }) {
  return (
    <input
      id={id}
      className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 transition ${
        error ? 'border-[#C8171E]' : 'border-[#E0E0E0] focus:border-[#C8171E]'
      }`}
      {...props}
    />
  )
}

function Select({ id, error, children, ...props }) {
  return (
    <select
      id={id}
      className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 transition ${
        error ? 'border-[#C8171E]' : 'border-[#E0E0E0] focus:border-[#C8171E]'
      }`}
      {...props}
    >
      {children}
    </select>
  )
}

function SeccionTitulo({ icon: Icon, titulo }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#C8171E]/10">
        <Icon size={15} className="text-[#C8171E]" />
      </span>
      <h2 className="text-base font-semibold text-[#111111]">{titulo}</h2>
      <div className="flex-1 h-px bg-[#E0E0E0]" />
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function SolicitudExterna() {
  const [form, setForm] = useState(FORM_INICIAL)
  const [errores, setErrores] = useState({})
  const [declaracion, setDeclaracion] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null) // { id }
  const [errorRed, setErrorRed] = useState('')

  const esPersonaNatural = form.tipoEntidad === 'Persona natural'

  // Auditorios activos de la sede seleccionada
  const auditoriosFiltrados = MOCK_AUDITORIOS.filter(
    (a) => a.estado === 'ACTIVO' && a.sede === form.sede.toUpperCase()
  )

  const auditorioSeleccionado = MOCK_AUDITORIOS.find((a) => a.id === Number(form.auditorioId))

  // Limpiar auditorioId al cambiar de sede
  useEffect(() => {
    setForm((prev) => ({ ...prev, auditorioId: '' }))
  }, [form.sede])

  // Limpiar NIT y nombre entidad si es persona natural
  useEffect(() => {
    if (esPersonaNatural) {
      setForm((prev) => ({ ...prev, nombreEntidad: '', nit: '' }))
    }
  }, [esPersonaNatural])

  const set = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }))
    if (errores[campo]) setErrores((prev) => { const n = { ...prev }; delete n[campo]; return n })
  }

  const toggleEquipo = (equipo) => {
    setForm((prev) => ({
      ...prev,
      requiereEquipos: prev.requiereEquipos.includes(equipo)
        ? prev.requiereEquipos.filter((e) => e !== equipo)
        : [...prev.requiereEquipos, equipo],
    }))
  }

  const horaFinOpciones = FRANJAS_HORA.filter(
    (h) => !form.horaInicio || minutosDesde7(h) - minutosDesde7(form.horaInicio) >= 60
  )

  const handleEnviar = async () => {
    const errs = validarCampos(form, esPersonaNatural, auditorioSeleccionado)
    if (!declaracion) errs.declaracion = 'Debe aceptar la declaración'
    if (Object.keys(errs).length > 0) {
      setErrores(errs)
      // Scroll al primer error
      const primer = document.getElementById(Object.keys(errs)[0])
      primer?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setEnviando(true)
    setErrorRed('')

    const payload = { ...form }
    if (esPersonaNatural) {
      delete payload.nombreEntidad
      delete payload.nit
    }

    try {
      let idGenerado
      try {
        const { data } = await crearSolicitudExterna(payload)
        idGenerado = data.id
      } catch {
        // Mock: simular respuesta del backend con delay
        await new Promise((r) => setTimeout(r, 1500))
        const num = String(Math.floor(Math.random() * 900) + 100)
        idGenerado = `SE-${num}`
      }
      setConfirmacion({ id: idGenerado })
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error al enviar solicitud:', err)
      setErrorRed('Ocurrió un error al enviar la solicitud. Por favor intente de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const todosValidos =
    declaracion &&
    Object.keys(validarCampos(form, esPersonaNatural, auditorioSeleccionado)).length === 0

  // ── Pantalla de confirmación ─────────────────────────────────────────────
  if (confirmacion) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#111111] mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Su solicitud fue registrada con el número:
          </p>
          <div className="inline-block bg-[#C8171E]/10 text-[#C8171E] font-bold text-lg px-5 py-2 rounded-xl mb-6">
            {confirmacion.id}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Nos comunicaremos al correo{' '}
            <span className="font-medium text-[#111111]">{form.correoContacto}</span>{' '}
            en un plazo de <strong>2 días hábiles</strong>.
          </p>
          <div className="mt-6 pt-6 border-t border-[#E0E0E0]">
            <img src={escudo} alt="Universidad Libre" className="w-10 mx-auto opacity-40" />
            <p className="text-xs text-gray-400 mt-2">
              Universidad Libre · Seccional Pereira
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header institucional */}
      <header className="bg-[#111111] py-4 px-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={escudo} alt="Escudo Universidad Libre" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Universidad Libre</p>
            <p className="text-[#C8A84B] text-xs font-medium tracking-widest uppercase">
              Seccional Pereira
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Título de la página */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111111]">Solicitud de reserva de auditorio</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete el formulario para solicitar la reserva de un espacio. Todos los campos
            marcados son obligatorios.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Sección 1: Datos de la entidad ── */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <SeccionTitulo icon={Building2} titulo="Datos de la entidad solicitante" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo id="tipoEntidad" label="Tipo de entidad" error={errores.tipoEntidad}>
                <Select
                  id="tipoEntidad"
                  value={form.tipoEntidad}
                  onChange={set('tipoEntidad')}
                  error={errores.tipoEntidad}
                >
                  <option value="">Seleccione...</option>
                  {TIPOS_ENTIDAD.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Campo>

              {!esPersonaNatural && (
                <Campo id="nombreEntidad" label="Nombre de la organización" error={errores.nombreEntidad}>
                  <Input
                    id="nombreEntidad"
                    type="text"
                    value={form.nombreEntidad}
                    onChange={set('nombreEntidad')}
                    error={errores.nombreEntidad}
                    placeholder="Nombre completo"
                  />
                </Campo>
              )}

              {!esPersonaNatural && (
                <Campo id="nit" label="NIT / RUT" error={errores.nit}>
                  <Input
                    id="nit"
                    type="text"
                    value={form.nit}
                    onChange={set('nit')}
                    error={errores.nit}
                    placeholder="900123456-7"
                  />
                </Campo>
              )}

              <Campo id="nombreContacto" label="Nombre del responsable" error={errores.nombreContacto}>
                <Input
                  id="nombreContacto"
                  type="text"
                  value={form.nombreContacto}
                  onChange={set('nombreContacto')}
                  error={errores.nombreContacto}
                  placeholder="Nombre completo"
                />
              </Campo>

              <Campo id="cargoContacto" label="Cargo del responsable" error={errores.cargoContacto}>
                <Input
                  id="cargoContacto"
                  type="text"
                  value={form.cargoContacto}
                  onChange={set('cargoContacto')}
                  error={errores.cargoContacto}
                  placeholder="Ej: Director, Coordinador..."
                />
              </Campo>

              <Campo id="correoContacto" label="Correo electrónico" error={errores.correoContacto}>
                <Input
                  id="correoContacto"
                  type="email"
                  value={form.correoContacto}
                  onChange={set('correoContacto')}
                  error={errores.correoContacto}
                  placeholder="correo@institucion.com"
                />
              </Campo>

              <Campo id="telefonoContacto" label="Teléfono de contacto" error={errores.telefonoContacto}>
                <Input
                  id="telefonoContacto"
                  type="tel"
                  value={form.telefonoContacto}
                  onChange={set('telefonoContacto')}
                  error={errores.telefonoContacto}
                  placeholder="3001234567"
                />
              </Campo>
            </div>
          </section>

          {/* ── Sección 2: Datos del evento ── */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <SeccionTitulo icon={Calendar} titulo="Datos del evento" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo id="sede" label="Sede" error={errores.sede}>
                <Select id="sede" value={form.sede} onChange={set('sede')} error={errores.sede}>
                  <option value="">Seleccione...</option>
                  {SEDES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Campo>

              <Campo id="auditorioId" label="Auditorio" error={errores.auditorioId}>
                <Select
                  id="auditorioId"
                  value={form.auditorioId}
                  onChange={set('auditorioId')}
                  error={errores.auditorioId}
                  disabled={!form.sede}
                >
                  <option value="">
                    {form.sede ? 'Seleccione auditorio...' : 'Primero seleccione sede'}
                  </option>
                  {auditoriosFiltrados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} (cap. {a.capacidad})
                    </option>
                  ))}
                  {form.sede && auditoriosFiltrados.length === 0 && (
                    <option disabled>Sin auditorios disponibles</option>
                  )}
                </Select>
              </Campo>

              <Campo id="fecha" label="Fecha del evento" error={errores.fecha}>
                <Input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={set('fecha')}
                  error={errores.fecha}
                  min={new Date().toISOString().split('T')[0]}
                />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo id="horaInicio" label="Hora inicio" error={errores.horaInicio}>
                  <Select
                    id="horaInicio"
                    value={form.horaInicio}
                    onChange={(e) => {
                      set('horaInicio')(e)
                      setForm((prev) => ({ ...prev, horaInicio: e.target.value, horaFin: '' }))
                      if (errores.horaInicio) setErrores((p) => { const n={...p}; delete n.horaInicio; return n })
                    }}
                    error={errores.horaInicio}
                  >
                    <option value="">--:--</option>
                    {FRANJAS_HORA.slice(0, -2).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </Select>
                </Campo>

                <Campo id="horaFin" label="Hora fin" error={errores.horaFin}>
                  <Select
                    id="horaFin"
                    value={form.horaFin}
                    onChange={set('horaFin')}
                    error={errores.horaFin}
                    disabled={!form.horaInicio}
                  >
                    <option value="">--:--</option>
                    {horaFinOpciones.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </Select>
                </Campo>
              </div>

              <Campo id="nombreEvento" label="Nombre del evento" error={errores.nombreEvento}>
                <Input
                  id="nombreEvento"
                  type="text"
                  value={form.nombreEvento}
                  onChange={set('nombreEvento')}
                  error={errores.nombreEvento}
                  placeholder="Nombre oficial del evento"
                />
              </Campo>

              <Campo id="tipoEvento" label="Tipo de evento" error={errores.tipoEvento}>
                <Select
                  id="tipoEvento"
                  value={form.tipoEvento}
                  onChange={set('tipoEvento')}
                  error={errores.tipoEvento}
                >
                  <option value="">Seleccione...</option>
                  {TIPOS_EVENTO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Campo>

              <div className="sm:col-span-2">
                <Campo id="descripcionEvento" label="Descripción del evento" error={errores.descripcionEvento}>
                  <textarea
                    id="descripcionEvento"
                    value={form.descripcionEvento}
                    onChange={set('descripcionEvento')}
                    rows={3}
                    placeholder="Describa el objetivo y actividades del evento (mínimo 30 caracteres)"
                    className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 transition resize-none ${
                      errores.descripcionEvento
                        ? 'border-[#C8171E]'
                        : 'border-[#E0E0E0] focus:border-[#C8171E]'
                    }`}
                  />
                  <div className="flex justify-between mt-0.5">
                    {errores.descripcionEvento ? (
                      <p className="flex items-center gap-1 text-xs text-[#C8171E]">
                        <AlertCircle size={12} /> {errores.descripcionEvento}
                      </p>
                    ) : <span />}
                    <span className="text-xs text-gray-400">
                      {form.descripcionEvento.length} caracteres
                    </span>
                  </div>
                </Campo>
              </div>

              <Campo id="numAsistentes" label="Número estimado de asistentes" error={errores.numAsistentes}>
                <Input
                  id="numAsistentes"
                  type="number"
                  min={1}
                  value={form.numAsistentes}
                  onChange={set('numAsistentes')}
                  error={errores.numAsistentes}
                  placeholder="Ej: 50"
                />
                {auditorioSeleccionado && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Capacidad del auditorio: {auditorioSeleccionado.capacidad} personas
                  </p>
                )}
              </Campo>

              <div className="sm:col-span-2">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700 mb-2">
                    Equipos requeridos{' '}
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {EQUIPOS_OPCIONES.map((eq) => (
                      <label
                        key={eq}
                        className="flex items-center gap-2 text-sm cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={form.requiereEquipos.includes(eq)}
                          onChange={() => toggleEquipo(eq)}
                          className="w-4 h-4 accent-[#C8171E]"
                        />
                        {eq}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>
          </section>

          {/* ── Declaración y envío ── */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="declaracion"
                checked={declaracion}
                onChange={(e) => {
                  setDeclaracion(e.target.checked)
                  if (errores.declaracion) setErrores((p) => { const n={...p}; delete n.declaracion; return n })
                }}
                className="mt-0.5 w-4 h-4 accent-[#C8171E] flex-shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Declaro que la información proporcionada es veraz y que la entidad que represento
                asume la responsabilidad del uso del espacio y el pago de las tarifas establecidas
                por la <strong>Universidad Libre Seccional Pereira</strong>.
              </span>
            </label>
            {errores.declaracion && (
              <p className="flex items-center gap-1 text-xs text-[#C8171E] mt-2">
                <AlertCircle size={12} /> {errores.declaracion}
              </p>
            )}

            {errorRed && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <AlertCircle size={15} /> {errorRed}
              </div>
            )}

            <button
              onClick={handleEnviar}
              disabled={enviando}
              className={`mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition ${
                enviando
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : todosValidos
                  ? 'bg-[#C8171E] hover:bg-[#a01016] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {enviando ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando solicitud...
                </>
              ) : (
                'Enviar solicitud'
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Recibirá respuesta en un plazo de 2 días hábiles al correo indicado.
            </p>
          </section>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        GRA — Gestor de Reservas Académicas · Universidad Libre Seccional Pereira
      </footer>
    </div>
  )
}
