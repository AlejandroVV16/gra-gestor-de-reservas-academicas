import { useState, useEffect } from 'react'
import { Building2, User, Calendar, CheckCircle2, AlertCircle, Loader2, Check, X, Info, FileUp, CreditCard } from 'lucide-react'
import { crearSolicitudExterna } from '../api/solicitudesExternasApi'
import { getHorario, getAuditoriosActivos } from '../api/auditoriosApi'
import { getEquiposActivos } from '../api/equiposApi'
import TimelineDiario from '../components/reservas/TimelineDiario'
import SelectorAuditorio from '../components/reservas/SelectorAuditorio'
import escudo from '../resources/escudo-unilibre.png.png'

const TIPOS_ENTIDAD = [
  'Colegio público / Jardín público',
  'Colegio privado / Jardín privado',
  'Empresa privada',
  'Entidad pública',
  'ONG / Fundación',
  'Persona natural',
  'Otro',
]

const TIPOS_EVENTO = [
  'Conferencia',
  'Seminario',
  'Capacitación',
  'Graduación',
  'Evento cultural',
  'Otro',
]

const EQUIPOS_OPCIONES = [
  { id: 'mesas-formica',  nombre: 'Mesas en fórmica',     precio: 13000, porUnidad: true, max: 5  },
  { id: 'mesas-rimax',    nombre: 'Mesas Rimax',          precio: 6000,  porUnidad: true, max: 5  },
  { id: 'sillas-rimax',   nombre: 'Sillas Rimax',         precio: 1000,  porUnidad: true, max: 20 },
  { id: 'otras-sillas',   nombre: 'Otras sillas',         precio: 5000,  porUnidad: true, max: 20 },
  { id: 'microfono',      nombre: 'Micrófonos',           precio: 85000, porUnidad: true, max: 3  },
  { id: 'manteles',       nombre: 'Manteles',             precio: 11000, porUnidad: true, max: 5  },
  { id: 'sobre-mantel',   nombre: 'Sobre manteles',       precio: 9000,  porUnidad: true, max: 5  },
]

function calcularTotalEquipos(equipos) {
  return equipos.reduce((sum, e) => sum + (e.cantidad || 1) * e.precioUnitario, 0)
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_TEL = /^[0-9]{7,15}$/

function getExternalType(tipo) {
  if (tipo === 'Colegio público / Jardín público') return 'escuela_publica'
  if (tipo === 'Colegio privado / Jardín privado') return 'escuela_privada'
  return 'general'
}

const TARIFAS = {
  'Auditorio Rodrigo Rivera Correa': {
    escuela_publica:  { 4: 2568000, 6: 3840000 },
    escuela_privada:  { 4: 3424000, 6: 5120000 },
    general:          { 4: 4280000, 6: 6400000 },
  },
  'Auditorio Cesar Gaviria Trujillo': {
    escuela_publica:  { 4: 1926000, 6: 2880000 },
    escuela_privada:  { 4: 2568000, 6: 3840000 },
    general:          { 4: 3210000, 6: 4800000 },
  },
  'Paraninfo Benjamin Herrera': {
    escuela_publica:  { 4: 1284000, 6: 1920000 },
    escuela_privada:  { 4: 1712000, 6: 2560000 },
    general:          { 4: 2140000, 6: 3200000 },
  },
  'Auditorio Rodrigo Rivera Correa (1/4)': {
    escuela_publica:  { 4: 642000, 6: 960000 },
    escuela_privada:  { 4: 856000, 6: 1280000 },
    general:          { 4: 1070000, 6: 1600000 },
  },
  'Auditorio Rodrigo Rivera Correa Ppal(1/2)': {
    escuela_publica:  { 4: 1284000, 6: 1920000 },
    escuela_privada:  { 4: 1712000, 6: 2560000 },
    general:          { 4: 2140000, 6: 3200000 },
  },
  'Auditorio Auxiliar': {
    escuela_publica:  { 4: 400000, 6: 600000 },
    escuela_privada:  { 4: 600000, 6: 900000 },
    general:          { 4: 800000, 6: 1200000 },
  },
}

function calcularPrecio(auditorioNombre, tipoEntidad, horas) {
  const ext = getExternalType(tipoEntidad)
  const tarifasAud = TARIFAS[auditorioNombre]
  if (!tarifasAud) return null
  const precio = tarifasAud[ext]?.[horas]
  return precio ?? null
}

function formatearPrecio(valor) {
  return '$' + valor.toLocaleString('es-CO')
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
  }

  if (!f.auditorioId) errs.auditorioId = 'Seleccione un auditorio'
  if (!f.fecha) errs.fecha = 'Campo requerido'
  else {
    const d = new Date(f.fecha + 'T00:00:00')
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    if (d < hoy) errs.fecha = 'No se permiten fechas pasadas'
    else if (d.getDay() === 0) errs.fecha = 'No se permiten domingos'
  }
  if (!f.horaInicio) errs.horaInicio = 'Selecciona un horario en el timeline'
  if (f.horaInicio && f.horaFin) {
    const [hI, mI] = f.horaInicio.split(':').map(Number)
    const [hF, mF] = f.horaFin.split(':').map(Number)
    const diffHoras = (hF * 60 + mF - hI * 60 - mI) / 60
    if (diffHoras !== 4 && diffHoras !== 6) {
      errs.duracion = 'La reserva debe ser de exactamente 4 o 6 horas'
    }
  }
  if (!f.nombreEvento.trim()) errs.nombreEvento = 'Campo requerido'
  if (!f.tipoEvento) errs.tipoEvento = 'Seleccione un tipo'
  if (!f.descripcionEvento.trim()) errs.descripcionEvento = 'Campo requerido'
  if (!f.numAsistentes) errs.numAsistentes = 'Campo requerido'
  else if (auditorio && Number(f.numAsistentes) > auditorio.capacity) {
    errs.numAsistentes = `Excede la capacidad del auditorio (${auditorio.capacity} personas)`
  }

  const excedidos = f.requiereEquipos.filter(eq => eq.cantidad > (eq.max ?? 999))
  if (excedidos.length > 0) {
    errs.equipos = excedidos.map(eq => `${eq.nombre}: máximo ${eq.max}`).join('. ')
  }

  return errs
}

const FORM_INICIAL = {
  nombreEntidad: '',
  tipoEntidad: '',
  archivoRut: null,
  nombreContacto: '',
  cargoContacto: '',
  correoContacto: '',
  telefonoContacto: '',
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

export default function SolicitudExterna() {
  const [form, setForm] = useState(FORM_INICIAL)
  const [errores, setErrores] = useState({})
  const [declaracion, setDeclaracion] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)
  const [errorRed, setErrorRed] = useState('')
  const [infoDia, setInfoDia] = useState(null)
  const [cargandoDia, setCargandoDia] = useState(false)
  const [tarifasAbiertas, setTarifasAbiertas] = useState(false)
  const [confirmacionOpen, setConfirmacionOpen] = useState(false)
  const [pagoInfoOpen, setPagoInfoOpen] = useState(false)
  const [precioCalculado, setPrecioCalculado] = useState(null)
  const [precioEquipos, setPrecioEquipos] = useState(0)

  const [auditorios, setAuditorios] = useState([])
  const [auditoriosCargados, setAuditoriosCargados] = useState(false)
  const [equiposActivos, setEquiposActivos] = useState([])
  const [equiposCargados, setEquiposCargados] = useState(false)

  useEffect(() => {
    Promise.all([
      getAuditoriosActivos(),
      getEquiposActivos(),
    ])
      .then(([{ data: audData }, { data: eqData }]) => {
        setAuditorios(audData)
        setAuditoriosCargados(true)
        setEquiposActivos(eqData)
        setEquiposCargados(true)
      })
      .catch(() => {
        setAuditorios([])
        setAuditoriosCargados(true)
        setEquiposActivos([])
        setEquiposCargados(true)
      })
  }, [])

  const esPersonaNatural = form.tipoEntidad === 'Persona natural'

  const auditorioSeleccionado = auditorios.find((a) => a.id === form.auditorioId)

  useEffect(() => {
    if (esPersonaNatural) {
      setForm((prev) => ({ ...prev, nombreEntidad: '', archivoRut: null }))
    }
  }, [esPersonaNatural])

  const set = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }))
    if (errores[campo]) setErrores((prev) => { const n = { ...prev }; delete n[campo]; return n })
  }

  const toggleEquipo = (item) => {
    setForm((prev) => {
      const exists = prev.requiereEquipos.find(e => e.id === item.id)
      if (exists) {
        return { ...prev, requiereEquipos: prev.requiereEquipos.filter(e => e.id !== item.id) }
      }
      return {
        ...prev,
        requiereEquipos: [...prev.requiereEquipos, { id: item.id, nombre: item.nombre, cantidad: 1, max: item.max, precioUnitario: item.precio }]
      }
    })
  }

  const handleCantidad = (itemId, delta) => {
    setForm((prev) => ({
      ...prev,
      requiereEquipos: prev.requiereEquipos.map(e => {
        if (e.id !== itemId) return e
        const item = EQUIPOS_OPCIONES.find(o => o.id === itemId)
        const max = item?.max ?? 999
        return { ...e, cantidad: Math.max(1, Math.min(max, (e.cantidad || 1) + delta)) }
      })
    }))
  }

  const handleTimeSelect = ({ horaInicio, horaFin }) => {
    setForm((prev) => ({ ...prev, horaInicio, horaFin }))
    setErrores((prev) => { const n = { ...prev }; delete n.horaInicio; delete n.horaFin; delete n.duracion; return n })
  }

  useEffect(() => {
    if (!form.fecha || !form.auditorioId) {
      setInfoDia(null)
      return
    }
    setCargandoDia(true)
    getHorario(form.auditorioId, form.fecha)
      .then(({ data }) => {
        setInfoDia({ totalReservas: data.bloques_ocupados?.length || 0 })
      })
      .catch(() => setInfoDia(null))
      .finally(() => setCargandoDia(false))
  }, [form.fecha, form.auditorioId])

  const handleEnviar = () => {
    const errs = validarCampos(form, esPersonaNatural, auditorioSeleccionado)
    if (!declaracion) errs.declaracion = 'Debe aceptar la declaración'
    if (Object.keys(errs).length > 0) {
      setErrores(errs)
      const primer = document.getElementById(Object.keys(errs)[0])
      primer?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const [hI, mI] = form.horaInicio.split(':').map(Number)
    const [hF, mF] = form.horaFin.split(':').map(Number)
    const duracion = (hF * 60 + mF - hI * 60 - mI) / 60
    const precio = calcularPrecio(auditorioSeleccionado?.name, form.tipoEntidad, duracion)
    const equipos = calcularTotalEquipos(form.requiereEquipos)
    setPrecioCalculado(precio)
    setPrecioEquipos(equipos)
    setConfirmacionOpen(true)
  }

  const handleConfirmarEnvio = async () => {
    setConfirmacionOpen(false)
    setEnviando(true)
    setErrorRed('')

    let payload
    const tieneArchivo = form.archivoRut instanceof File

    if (tieneArchivo) {
      payload = new FormData()
      for (const [key, val] of Object.entries(form)) {
        if (key === 'archivoRut') {
          payload.append('archivoRut', val)
        } else if (key !== 'archivoRut') {
          payload.append(key, typeof val === 'object' ? JSON.stringify(val) : val)
        }
      }
      payload.append('auditorioNombre', auditorioSeleccionado?.name || '')
    } else {
      payload = { ...form, auditorioNombre: auditorioSeleccionado?.name }
      delete payload.archivoRut
    }

    if (esPersonaNatural) {
      if (tieneArchivo) {
        payload.delete('nombreEntidad')
        payload.delete('tipoEntidad')
      } else {
        delete payload.nombreEntidad
        delete payload.tipoEntidad
      }
    }

    try {
      let idGenerado
      try {
        const { data } = await crearSolicitudExterna(payload, tieneArchivo)
        idGenerado = data.id
      } catch {
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

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#111111]">Solicitud de reserva de auditorio</h1>
            <p className="text-gray-500 text-sm mt-1">
              Complete el formulario para solicitar la reserva de un espacio. Todos los campos marcados son obligatorios.
            </p>
          </div>
          <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <SeccionTitulo icon={Calendar} titulo="Datos del evento" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Seleccione el auditorio
                  </label>
                  {auditoriosCargados ? (
                    <SelectorAuditorio
                      auditorios={auditorios}
                      auditorioId={form.auditorioId}
                      onSelect={(a) => {
                        setForm((prev) => ({ ...prev, auditorioId: a.id, fecha: '', horaInicio: '', horaFin: '' }))
                        if (errores.auditorioId) setErrores((p) => { const n = { ...p }; delete n.auditorioId; return n })
                      }}
                      error={errores.auditorioId}
                    />
                  ) : (
                    <p className="text-gray-500 text-sm">Cargando auditorios...</p>
                  )}
                </div>

              {/* Timeline — se muestra al seleccionar auditorio */}
              {form.auditorioId && (
                <div className="sm:col-span-2 border border-[#E0E0E0] rounded-lg p-3">
                  {/* Selector de fecha integrado */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#C8171E]" />
                      <span className="font-semibold text-gray-700 text-sm">Disponibilidad horaria</span>
                      <button
                        type="button"
                        onClick={() => setTarifasAbiertas(true)}
                        className="ml-2 flex items-center gap-1 text-xs text-gray-500 hover:text-[#C8171E] underline"
                      >
                        <Info size={12} /> Ver tarifas
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => {
                          set('fecha')(e)
                          setForm((prev) => ({ ...prev, horaInicio: '', horaFin: '' }))
                          if (errores.fecha) setErrores((p) => { const n={...p}; delete n.fecha; return n })
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 transition ${
                          errores.fecha ? 'border-[#C8171E]' : 'border-[#E0E0E0] focus:border-[#C8171E]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Info del día */}
                  {form.fecha && infoDia && (
                    <p className={`text-xs mb-2 ${infoDia.totalReservas > 0 ? 'text-amber-600' : 'text-green-600'} flex items-center gap-1`}>
                      {infoDia.totalReservas > 0
                        ? `Este auditorio tiene ${infoDia.totalReservas} reserva(s) en esta fecha`
                        : 'No hay reservas en este auditorio para esta fecha'}
                      {cargandoDia && <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    </p>
                  )}

                  {/* Timeline */}
                  {form.fecha ? (
                    <TimelineDiario
                      auditorioId={form.auditorioId}
                      fecha={form.fecha}
                      selected={{ horaInicio: form.horaInicio, horaFin: form.horaFin }}
                      onTimeSelect={handleTimeSelect}
                    />
                  ) : (
                    <div className="text-sm text-gray-400 py-6 text-center">
                      Selecciona una fecha para ver los horarios disponibles
                    </div>
                  )}
                </div>
              )}

              {/* Horario seleccionado */}
              {form.horaInicio && form.horaFin && (() => {
                const [hI, mI] = form.horaInicio.split(':').map(Number)
                const [hF, mF] = form.horaFin.split(':').map(Number)
                const duracion = (hF * 60 + mF - hI * 60 - mI) / 60
                return (
                  <div className="sm:col-span-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <Check size={16} />
                    Inicio: <strong>{form.horaInicio}</strong>
                    <span className="text-green-500">·</span>
                    Duración: <strong>{duracion}h</strong>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, horaInicio: '', horaFin: '' }))}
                      className="ml-auto text-gray-400 hover:text-[#C8171E]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })()}

              {/* Error de fecha */}
              {errores.fecha && (
                <p className="sm:col-span-2 flex items-center gap-1 text-xs text-[#C8171E]">
                  <AlertCircle size={12} /> {errores.fecha}
                </p>
              )}

              {/* Errores de horario */}
              {errores.horaInicio && (
                <p className="sm:col-span-2 flex items-center gap-1 text-xs text-[#C8171E]">
                  <AlertCircle size={12} /> {errores.horaInicio}
                </p>
              )}
              {errores.duracion && (
                <p className="sm:col-span-2 flex items-center gap-1 text-xs text-[#C8171E]">
                  <AlertCircle size={12} /> {errores.duracion}
                </p>
              )}

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
                    placeholder="Describa el objetivo y actividades del evento"
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
                    Capacidad del auditorio: {auditorioSeleccionado.capacity} personas
                  </p>
                )}
              </Campo>

              <div className="sm:col-span-2">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700 mb-2">
                    Equipos requeridos{' '}
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </legend>
                  {!equiposCargados ? (
                    <p className="text-sm text-gray-400 py-2">Cargando equipos disponibles...</p>
                  ) : (
                    <div className="space-y-2">
                      {EQUIPOS_OPCIONES.filter(item => equiposActivos.some(eq => eq.name === item.nombre)).length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">No hay equipos disponibles en este momento</p>
                      ) : (
                        EQUIPOS_OPCIONES.filter(item => equiposActivos.some(eq => eq.name === item.nombre)).map((item) => {
                          const selec = form.requiereEquipos.find(e => e.id === item.id)
                          const cant = selec?.cantidad || 1
                          const subtotal = selec ? cant * item.precio : 0
                          return (
                            <div key={item.id} className={`border rounded-lg p-3 transition ${selec ? 'border-[#C8171E]/40 bg-[#C8171E]/5' : 'border-[#E0E0E0]'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={!!selec}
                                    onChange={() => toggleEquipo(item)}
                                    className="w-4 h-4 accent-[#C8171E] flex-shrink-0"
                                  />
                                  <span className="font-medium text-gray-700 truncate">{item.nombre}</span>
                                </label>
                                <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {formatearPrecio(item.precio)}{item.porUnidad ? ' c/u' : ''}
                                </span>
                              </div>
                              {selec && (
                                <div className="flex items-center justify-between mt-2 pl-6">
                                  <div className="flex items-center gap-1.5">
                                    {item.porUnidad ? (
                                      <>
                                        <span className="text-xs text-gray-500">Cant:</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCantidad(item.id, -1)}
                                          disabled={cant <= 1}
                                          className="w-6 h-6 rounded border border-[#E0E0E0] flex items-center justify-center text-sm font-medium text-gray-600 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                          –
                                        </button>
                                        <span className="w-7 text-center text-sm font-medium text-gray-800">{cant}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCantidad(item.id, 1)}
                                          disabled={cant >= item.max}
                                          className="w-6 h-6 rounded border border-[#E0E0E0] flex items-center justify-center text-sm font-medium text-gray-600 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                          +
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-gray-400">(único)</span>
                                    )}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-800">
                                    = {formatearPrecio(subtotal)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}

                  {errores.equipos && (
                    <p className="text-xs text-[#C8171E] bg-red-50 rounded-lg px-3 py-2 mt-3 flex items-start gap-1.5">
                      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                      {errores.equipos}
                    </p>
                  )}

                  {form.requiereEquipos.length > 0 && (
                    <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-[#E0E0E0]">
                      <span className="text-sm text-gray-600">Total equipos:</span>
                      <span className="text-base font-bold text-[#111111]">
                        {formatearPrecio(calcularTotalEquipos(form.requiereEquipos))}
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3 flex items-start gap-1.5">
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    Las sillas y mesas adicionales no podrán ser usadas dentro de los auditorios/salas.
                  </p>
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2 flex items-start gap-1.5">
                    <Info size={13} className="mt-0.5 flex-shrink-0" />
                    Por defecto se proporcionarán 2 micrófonos inalámbricos para el evento.
                  </p>
                </fieldset>
              </div>
            </div>
          </section>

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
                <Campo id="archivoRut" label="Documento RUT (PDF)" error={errores.archivoRut}>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 border border-[#E0E0E0] rounded-lg cursor-pointer hover:border-[#C8171E] transition text-sm text-gray-600 hover:text-[#C8171E]">
                      <FileUp size={16} />
                      {form.archivoRut ? form.archivoRut.name : 'Seleccionar archivo'}
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file && file.type !== 'application/pdf') {
                            setErrores(p => ({ ...p, archivoRut: 'Solo se aceptan archivos PDF' }))
                            return
                          }
                          setForm(p => ({ ...p, archivoRut: file || null }))
                          if (errores.archivoRut) setErrores(p => { const n = { ...p }; delete n.archivoRut; return n })
                        }}
                      />
                    </label>
                    {form.archivoRut && (
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, archivoRut: null }))}
                        className="text-xs text-gray-400 hover:text-[#C8171E]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {form.archivoRut && (
                    <p className="text-xs text-gray-400 mt-1">
                      {(form.archivoRut.size / 1024).toFixed(1)} KB
                    </p>
                  )}
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

            <button
              type="button"
              onClick={() => setPagoInfoOpen(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-[#C8A84B]/40 text-[#C8A84B] hover:bg-[#C8A84B]/5 transition"
            >
              <CreditCard size={16} />
              Información de pago
            </button>

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

      {/* Modal de tarifas */}
      {tarifasAbiertas && auditorioSeleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setTarifasAbiertas(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-[#C8171E]"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-[#111111] mb-1">Tarifas</h3>
            <p className="text-sm text-gray-500 mb-4">{auditorioSeleccionado.name}</p>
            {(() => {
              const tarifas = TARIFAS[auditorioSeleccionado.name]
              if (!tarifas) return <p className="text-sm text-gray-400">No hay tarifas disponibles</p>
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">Tipo</th>
                      <th className="text-right py-2 font-medium text-gray-600">4h</th>
                      <th className="text-right py-2 font-medium text-gray-600">6h</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tarifas).map(([key, val]) => (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="py-2 text-gray-700 capitalize">
                          {key === 'escuela_publica' ? 'Colegio público' :
                           key === 'escuela_privada' ? 'Colegio privado' : 'General'}
                        </td>
                        <td className="py-2 text-right">{formatearPrecio(val[4])}</td>
                        <td className="py-2 text-right">{formatearPrecio(val[6])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">Aplica el IVA sobre el valor de la tarifa.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmacionOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#C8171E]/10 flex items-center justify-center">
                <Info size={28} className="text-[#C8171E]" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-2">Confirmar solicitud</h3>
            <p className="text-sm text-gray-500 mb-4">
              {precioCalculado != null
                ? 'El valor estimado de esta reserva es:'
                : 'No se pudo calcular el valor de la reserva.'}
            </p>
            {precioCalculado != null && (
              <div className="text-left space-y-1.5 mb-4">
                <p className="text-sm text-gray-500 flex justify-between">
                  <span>Tarifa del auditorio</span>
                  <span>{formatearPrecio(precioCalculado)}</span>
                </p>
                {precioEquipos > 0 && (
                  <p className="text-sm text-gray-500 flex justify-between">
                    <span>Equipos adicionales</span>
                    <span>{formatearPrecio(precioEquipos)}</span>
                  </p>
                )}
                <div className="border-t border-gray-200 pt-1.5 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-[#111111]">{formatearPrecio(precioCalculado + (precioEquipos || 0))}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmacionOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEnvio}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#C8171E] hover:bg-[#a01016] text-white transition"
              >
                Confirmar y enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de información de pago */}
      {pagoInfoOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-[#C8171E]" />
              Información de pago
            </h3>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Una vez creada la solicitud, en un plazo máximo de <strong>2 días hábiles</strong> nos
                contactaremos contigo para realizar la <strong>primera factura</strong> correspondiente
                al <strong>50% del valor total</strong> de la reserva.
              </p>
              <p>
                Tendrás <strong>7 días calendario</strong> para realizar el pago de esta primera factura.
                Una vez confirmado el pago, se confirmará la reserva del espacio seleccionado.
              </p>
              <p>
                La <strong>segunda factura</strong> con el <strong>50% restante</strong> deberá ser
                pagada máximo <strong>3 días antes de la fecha del evento</strong>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>Nota:</strong> El incumplimiento de los plazos de pago podrá resultar en la
                cancelación automática de la reserva.
              </div>
            </div>
            <button
              onClick={() => setPagoInfoOpen(false)}
              className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold bg-[#C8171E] hover:bg-[#a01016] text-white transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <footer className="text-center py-6 text-xs text-gray-400">
        GRA — Gestor de Reservas Académicas · Universidad Libre Seccional Pereira
      </footer>
    </div>
  )
}
