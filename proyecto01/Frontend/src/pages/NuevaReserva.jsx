import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, X, Check, Building2, Calendar, LayoutGrid, Maximize2, Info, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { crearReserva } from '../api/reservasApi'
import { getAuditorios, getDisponibilidad, getHorario } from '../api/auditoriosApi'
import { getEquiposActivos } from '../api/equiposApi'
import TimelineDiario from '../components/reservas/TimelineDiario'
import ConflictoAlert from '../components/reservas/ConflictoAlert'
import SelectorSecciones from '../components/reservas/SelectorSecciones'
import SelectorAuditorio from '../components/reservas/SelectorAuditorio'

const TIPOS_EVENTO = [
  'Conferencia', 'Seminario', 'Capacitación',
  'Graduación', 'Evento cultural', 'Otro',
]

const EQUIPOS_OPCIONES = [
  { id: 'mesas-formica', nombre: 'Mesas en fórmica', max: 5 },
  { id: 'mesas-rimax',   nombre: 'Mesas Rimax',      max: 5 },
  { id: 'sillas-rimax',  nombre: 'Sillas Rimax',      max: 20 },
  { id: 'otras-sillas',  nombre: 'Otras sillas',      max: 20 },
  { id: 'microfonos',    nombre: 'Micrófonos',        max: 3 },
  { id: 'manteles',      nombre: 'Manteles',          max: 5 },
  { id: 'sobre-mantel',  nombre: 'Sobre manteles',    max: 5 },
]

const TARIFAS = {
  'Auditorio Rodrigo Rivera Correa': {
    general:          { 4: 4280000, 6: 6400000 },
  },
  'Auditorio Cesar Gaviria Trujillo': {
    general:          { 4: 3210000, 6: 4800000 },
  },
  'Paraninfo Benjamin Herrera': {
    general:          { 4: 2140000, 6: 3200000 },
  },
  'Auditorio Rodrigo Rivera Correa (1/4)': {
    general:          { 4: 1070000, 6: 1600000 },
  },
  'Auditorio Rodrigo Rivera Correa Ppal(1/2)': {
    general:          { 4: 2140000, 6: 3200000 },
  },
  'Auditorio Auxiliar': {
    general:          { 4: 800000, 6: 1200000 },
  },
}

function formatearPrecio(valor) {
  return '$' + valor.toLocaleString('es-CO')
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_TEL = /^[0-9]{7,15}$/

const FORM_INICIAL = {
  fecha: '', horaInicio: '', horaFin: '', auditorioId: '',
  encargado: '', correoContacto: '', telefonoContacto: '',
  facultad: '', tipoEvento: '', nombreEvento: '',
  descripcion: '', personas: '', requiereEquipos: [],
  usarSecciones: false, secciones: [],
}

export default function NuevaReserva() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useApp()

  const [form, setForm] = useState(() => ({
    ...FORM_INICIAL,
    fecha: searchParams.get('fecha') || '',
    horaInicio: searchParams.get('horaInicio') || '',
    horaFin: searchParams.get('horaFin') || '',
    auditorioId: searchParams.get('auditorioId') || '',
  }))

  const [conflictos, setConflictos] = useState([])
  const [verificando, setVerificando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [infoDia, setInfoDia] = useState(null)
  const [cargandoDia, setCargandoDia] = useState(false)
  const [auditorios, setAuditorios] = useState([])
  const [declaracion, setDeclaracion] = useState(false)
  const [tarifasAbiertas, setTarifasAbiertas] = useState(false)
  const [confirmacionOpen, setConfirmacionOpen] = useState(false)
  const [equiposActivos, setEquiposActivos] = useState([])
  const [cargandoEquipos, setCargandoEquipos] = useState(true)

  useEffect(() => {
    Promise.all([
      getAuditorios(),
      getEquiposActivos(),
    ])
      .then(([{ data: audData }, { data: eqData }]) => {
        setAuditorios(audData)
        setEquiposActivos(eqData)
      })
      .catch(() => {
        setAuditorios([])
        setEquiposActivos([])
      })
      .finally(() => setCargandoEquipos(false))
  }, [])

  const auditorioSel = auditorios.find((a) => a.id === form.auditorioId)
  const esDivisible  = auditorioSel?.divisible === true

  const capacidadEfectiva = form.usarSecciones && esDivisible
    ? (auditorioSel?.secciones || [])
        .filter((s) => form.secciones.includes(s.id))
        .reduce((acc, s) => acc + s.capacidad, 0)
    : auditorioSel?.capacity || 999

  const handleAuditorioSelect = (a) => {
    setForm((p) => ({
      ...p,
      auditorioId: a.id,
      fecha: '',
      horaInicio: '',
      horaFin: '',
      usarSecciones: false,
      secciones: [],
    }))
    if (errores.auditorioId) setErrores((p) => { const n = { ...p }; delete n.auditorioId; return n })
  }

  const toggleUsarSecciones = () => {
    setForm((p) => ({
      ...p,
      usarSecciones: !p.usarSecciones,
      secciones: [],
      personas: '',
    }))
  }

  const handleTimeSelect = ({ horaInicio, horaFin }) => {
    setForm((p) => ({ ...p, horaInicio, horaFin }))
    setErrores((p) => ({ ...p, horaInicio: '', horaFin: '', duracion: '' }))
  }

  const verificarDisponibilidad = useCallback(async () => {
    if (!form.auditorioId || !form.fecha || !form.horaInicio || !form.horaFin) return
    setVerificando(true)
    try {
      const { data } = await getDisponibilidad(form.auditorioId, {
        fecha: form.fecha,
        hora_inicio: form.horaInicio,
        hora_fin: form.horaFin,
      })
      setConflictos(data.disponible ? [] : data.conflictos)
    } catch {
      setConflictos([])
    } finally {
      setVerificando(false)
    }
  }, [form.auditorioId, form.fecha, form.horaInicio, form.horaFin])

  useEffect(() => {
    verificarDisponibilidad()
  }, [verificarDisponibilidad])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrores((p) => ({ ...p, [name]: '' }))
  }

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
        requiereEquipos: [...prev.requiereEquipos, { id: item.id, nombre: item.nombre, cantidad: 1, max: item.max }],
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
      }),
    }))
  }

  const validar = () => {
    const e = {}
    if (!form.auditorioId) e.auditorioId = 'Selecciona un auditorio'
    if (!form.fecha) e.fecha = 'Campo requerido'
    else {
      const d = new Date(form.fecha + 'T00:00:00')
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      if (d < hoy) e.fecha = 'No se permiten fechas pasadas'
      else if (d.getDay() === 0) e.fecha = 'No se permiten domingos'
    }
    if (!form.horaInicio) e.horaInicio = 'Selecciona un horario en el timeline'
    if (form.horaInicio && form.horaFin) {
      const [hI, mI] = form.horaInicio.split(':').map(Number)
      const [hF, mF] = form.horaFin.split(':').map(Number)
      const diffHoras = (hF * 60 + mF - hI * 60 - mI) / 60
      if (diffHoras !== 4 && diffHoras !== 6) {
        e.duracion = 'La reserva debe ser de exactamente 4 o 6 horas'
      }
    }
    if (!form.nombreEvento.trim()) e.nombreEvento = 'Campo requerido'
    if (!form.tipoEvento) e.tipoEvento = 'Selecciona un tipo'
    if (!form.encargado.trim()) e.encargado = 'Campo requerido'
    if (!form.correoContacto.trim()) e.correoContacto = 'Campo requerido'
    else if (!RE_EMAIL.test(form.correoContacto)) e.correoContacto = 'Correo inválido'
    if (!form.telefonoContacto.trim()) e.telefonoContacto = 'Campo requerido'
    else if (!RE_TEL.test(form.telefonoContacto)) e.telefonoContacto = 'Solo números, 7–15 dígitos'
    if (!form.facultad) e.facultad = 'Campo requerido'
    if (!form.personas) e.personas = 'Campo requerido'

    const excedidos = form.requiereEquipos.filter(eq => eq.cantidad > (eq.max ?? 999))
    if (excedidos.length > 0) {
      e.equipos = excedidos.map(eq => `${eq.nombre}: máximo ${eq.max}`).join('. ')
    }

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const abrirConfirmacion = () => {
    if (!validar()) return
    if (!declaracion) { addToast({ tipo: 'error', mensaje: 'Debe aceptar la declaración antes de continuar' }); return }
    if (!form.horaInicio || !form.horaFin) return
    setConfirmacionOpen(true)
  }

  const handleGuardar = async () => {
    setConfirmacionOpen(false)
    setGuardando(true)
    try {
      const payload = {
        ...form,
        auditorioNombre: auditorioSel?.name,
      }
      delete payload.usarSecciones
      delete payload.secciones
      if (payload.requiereEquipos.length === 0) delete payload.requiereEquipos
      await crearReserva(payload)
      addToast({ tipo: 'exito', mensaje: 'Reserva creada exitosamente' })
      navigate('/reservas')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al crear la reserva'
      addToast({ tipo: 'error', mensaje: msg })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Nueva Reserva</h1>
          <p className="text-sm text-gray-500 mt-0.5">Completa los datos de la reserva de auditorio</p>
        </div>
        <button onClick={() => navigate('/reservas')} className="btn-secondary">
          <X size={16} /> Cancelar
        </button>
      </div>

      <ConflictoAlert conflictos={conflictos} auditorio={auditorioSel?.name} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          {/* Selector de auditorio visual */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 border-b border-[#E0E0E0] pb-3 mb-4">
              Selección de auditorio
            </h2>
            <SelectorAuditorio
              auditorios={auditorios}
              auditorioId={form.auditorioId}
              onSelect={handleAuditorioSelect}
              error={errores.auditorioId}
            />
          </div>

          {/* Timeline con fecha integrada */}
          {form.auditorioId && (
            <div className="card p-5">
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
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => {
                    set('fecha')(e)
                    setForm((prev) => ({ ...prev, horaInicio: '', horaFin: '' }))
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 transition ${
                    errores.fecha ? 'border-[#C8171E]' : 'border-[#E0E0E0] focus:border-[#C8171E]'
                  }`}
                />
              </div>

              {form.fecha && infoDia && (
                <p className={`text-xs mb-2 ${infoDia.totalReservas > 0 ? 'text-amber-600' : 'text-green-600'} flex items-center gap-1`}>
                  {infoDia.totalReservas > 0
                    ? `Este auditorio tiene ${infoDia.totalReservas} reserva(s) en esta fecha`
                    : 'No hay reservas en este auditorio para esta fecha'}
                  {cargandoDia && <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                </p>
              )}

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

              {form.horaInicio && form.horaFin && (() => {
                const [hI, mI] = form.horaInicio.split(':').map(Number)
                const [hF, mF] = form.horaFin.split(':').map(Number)
                const duracion = (hF * 60 + mF - hI * 60 - mI) / 60
                return (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-2">
                    <Check size={16} />
                    Inicio: <strong>{form.horaInicio}</strong>
                    <span className="text-green-500">·</span>
                    Duración: <strong>{duracion}h</strong>
                    <button
                      onClick={() => setForm((p) => ({ ...p, horaInicio: '', horaFin: '' }))}
                      className="ml-auto text-gray-400 hover:text-[#C8171E]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })()}

              {errores.fecha && (
                <p className="flex items-center gap-1 text-xs text-[#C8171E] mt-1">
                  <AlertCircle size={12} /> {errores.fecha}
                </p>
              )}
              {errores.horaInicio && (
                <p className="flex items-center gap-1 text-xs text-[#C8171E] mt-1">
                  <AlertCircle size={12} /> {errores.horaInicio}
                </p>
              )}
              {errores.duracion && (
                <p className="flex items-center gap-1 text-xs text-[#C8171E] mt-1">
                  <AlertCircle size={12} /> {errores.duracion}
                </p>
              )}
            </div>
          )}

          {/* Panel de secciones */}
          {esDivisible && (
            <div className="card p-5">
              <div className="rounded-xl border border-[#C8A84B]/40 bg-[#C8A84B]/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Configuración del espacio</p>
                    <p className="text-xs text-gray-500">
                      Este auditorio puede dividirse en hasta {auditorioSel.secciones?.length} secciones independientes
                    </p>
                  </div>
                  <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => !form.usarSecciones || toggleUsarSecciones()}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        !form.usarSecciones
                          ? 'bg-white text-[#111111] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Maximize2 size={13} />
                      Sala completa
                    </button>
                    <button
                      type="button"
                      onClick={() => form.usarSecciones || toggleUsarSecciones()}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        form.usarSecciones
                          ? 'bg-[#C8171E] text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <LayoutGrid size={13} />
                      Por secciones
                    </button>
                  </div>
                </div>

                {form.usarSecciones && (
                  <SelectorSecciones
                    secciones={auditorioSel.secciones}
                    seleccionadas={form.secciones}
                    ocupadas={[]}
                    onChange={(nuevas) => {
                      const cap = auditorioSel.secciones
                        .filter((s) => nuevas.includes(s.id))
                        .reduce((acc, s) => acc + s.capacidad, 0)
                      setForm((p) => ({ ...p, secciones: nuevas, personas: cap > 0 ? String(cap) : '' }))
                    }}
                  />
                )}

                {!form.usarSecciones && (
                  <div className="flex items-center justify-between text-xs text-gray-600 bg-white/70 rounded-lg px-3 py-2">
                    <span>Usando el auditorio completo</span>
                    <span className="font-semibold text-[#C8A84B]">{auditorioSel.capacity} personas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detalles del evento */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 border-b border-[#E0E0E0] pb-3">
              Detalles del evento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Nombre del evento" error={errores.nombreEvento}>
                <input type="text" name="nombreEvento" value={form.nombreEvento} onChange={handleChange} className="input-field" placeholder="Nombre oficial del evento" />
              </Campo>
              <Campo label="Tipo de evento" error={errores.tipoEvento}>
                <select name="tipoEvento" value={form.tipoEvento} onChange={handleChange} className="input-field">
                  <option value="">Selecciona tipo</option>
                  {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Campo>
            </div>
            <Campo label="Descripción" opcional>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="input-field resize-none"
                rows={3}
                placeholder="Describe el objetivo y actividades del evento (opcional)"
              />
            </Campo>
            <Campo label="Cantidad de asistentes" error={errores.personas}>
              <input
                type="number"
                name="personas"
                value={form.personas}
                onChange={handleChange}
                className={`input-field w-32 ${form.usarSecciones && esDivisible ? 'bg-gray-50 cursor-default' : ''}`}
                readOnly={form.usarSecciones && esDivisible}
                min={1}
                max={capacidadEfectiva}
                placeholder="0"
              />
              {auditorioSel && (
                <p className="text-xs text-gray-400 mt-1">
                  Capacidad máxima:{' '}
                  <strong>
                    {form.usarSecciones && esDivisible
                      ? `${capacidadEfectiva} personas (secciones seleccionadas)`
                      : `${auditorioSel.capacity} personas`}
                  </strong>
                </p>
              )}
            </Campo>
          </div>

          {/* Equipos requeridos */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 border-b border-[#E0E0E0] pb-3 mb-4">
              Equipos requeridos <span className="text-gray-400 font-normal">(opcional)</span>
            </h2>
            {cargandoEquipos ? (
              <p className="text-sm text-gray-400 py-2">Cargando equipos disponibles...</p>
            ) : (
              <div className="space-y-2">
                {EQUIPOS_OPCIONES.filter(item => equiposActivos.some(eq => eq.name === item.nombre)).length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No hay equipos disponibles en este momento</p>
                ) : (
                  EQUIPOS_OPCIONES.filter(item => equiposActivos.some(eq => eq.name === item.nombre)).map((item) => {
                    const selec = form.requiereEquipos.find(e => e.id === item.id)
                    const cant = selec?.cantidad || 1
                    return (
                      <div key={item.id} className={`border rounded-lg p-3 transition ${selec ? 'border-[#C8171E]/40 bg-[#C8171E]/5' : 'border-[#E0E0E0]'}`}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={!!selec}
                            onChange={() => toggleEquipo(item)}
                            className="w-4 h-4 accent-[#C8171E] flex-shrink-0"
                          />
                          <span className="font-medium text-gray-700 truncate">{item.nombre}</span>
                        </label>
                        {selec && (
                          <div className="flex items-center gap-1.5 mt-2 pl-6">
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
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3 flex items-start gap-1.5">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              Las sillas y mesas adicionales no podrán ser usadas dentro de los auditorios/salas.
            </p>
          </div>

          {/* Responsable */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 border-b border-[#E0E0E0] pb-3">
              Responsable
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Nombre del encargado" error={errores.encargado}>
                <input type="text" name="encargado" value={form.encargado} onChange={handleChange} className="input-field" placeholder="Nombre completo" />
              </Campo>
              <Campo label="Facultad / Dependencia" error={errores.facultad}>
                <select name="facultad" value={form.facultad} onChange={handleChange} className="input-field">
                  <option value="">Selecciona facultad</option>
                  <option value="Ingeniería">Ingeniería</option>
                  <option value="Ciencias de la Salud">Ciencias de la Salud</option>
                  <option value="Derecho">Derecho</option>
                  <option value="Ciencias Económicas">Ciencias Económicas</option>
                  <option value="Ciencias Educación">Ciencias Educación</option>
                </select>
              </Campo>
              <Campo label="Correo electrónico" error={errores.correoContacto}>
                <input type="email" name="correoContacto" value={form.correoContacto} onChange={handleChange} className="input-field" placeholder="correo@unilibre.edu.co" />
              </Campo>
              <Campo label="Teléfono" error={errores.telefonoContacto}>
                <input type="tel" name="telefonoContacto" value={form.telefonoContacto} onChange={handleChange} className="input-field" placeholder="3001234567" />
              </Campo>
            </div>
          </div>

          {/* Declaración y botón guardar */}
          <div className="card p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declaracion}
                onChange={(e) => setDeclaracion(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#C8171E] flex-shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Declaro que la información proporcionada es veraz y que asumo la responsabilidad
                del uso del espacio solicitado.
              </span>
            </label>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => navigate('/reservas')} className="btn-secondary">
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={abrirConfirmacion}
                disabled={guardando || conflictos.length > 0}
                className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {guardando ? 'Guardando...' : 'Guardar Reserva'}
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-[#C8171E]" />
              {auditorioSel ? auditorioSel.name : 'Selecciona un auditorio'}
            </h3>
            {auditorioSel ? (
              <>
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  {auditorioSel.image ? (
                    <img src={`/uploads/auditorios/${auditorioSel.image}`} alt={auditorioSel.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={48} className="text-gray-300" />
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
                  <InfoLine label="Sede" valor={auditorioSel.location || '—'} />
                  <InfoLine
                    label="Capacidad"
                    valor={
                      form.usarSecciones && esDivisible
                        ? `${capacidadEfectiva} personas (${form.secciones.length} secc.)`
                        : `${auditorioSel.capacity} personas`
                    }
                  />
                  {auditorioSel.description && (
                    <InfoLine label="Descripción" valor={auditorioSel.description} />
                  )}
                  {esDivisible && (
                    <InfoLine
                      label="Modo"
                      valor={form.usarSecciones ? `Dividido — ${form.secciones.length || 0} secc.` : 'Sala completa'}
                    />
                  )}
                  {conflictos.length > 0 ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[#C8171E] font-medium text-xs">
                      <span className="w-2 h-2 bg-[#C8171E] rounded-full" />
                      No disponible en el horario seleccionado
                    </div>
                  ) : (form.fecha && form.horaInicio && form.horaFin) && (
                    <div className="mt-2 flex items-center gap-1.5 text-green-600 font-medium text-xs">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      Disponible en el horario seleccionado
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                Selecciona un auditorio para ver su información
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[#C8171E]" />
              Fecha seleccionada
            </h3>
            {form.fecha ? (
              <div className="text-center">
                <p className="text-3xl font-bold text-[#C8171E]">
                  {new Date(form.fecha + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric' })}
                </p>
                <p className="text-gray-600 font-medium capitalize">
                  {new Date(form.fecha + 'T00:00').toLocaleDateString('es-CO', { weekday: 'long', month: 'long', year: 'numeric' })}
                </p>
                {form.horaInicio && form.horaFin && (
                  <p className="text-sm text-gray-500 mt-1">{form.horaInicio} – {form.horaFin}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Selecciona una fecha</p>
            )}
          </div>

        </div>
      </div>

      {/* Modal de tarifas */}
      {tarifasAbiertas && auditorioSel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setTarifasAbiertas(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-[#C8171E]"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-[#111111] mb-1">Tarifas de referencia</h3>
            <p className="text-sm text-gray-500 mb-4">{auditorioSel.name}</p>
            {(() => {
              const tarifas = TARIFAS[auditorioSel.name]
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
            <h3 className="text-lg font-bold text-[#111111] mb-2">Confirmar reserva</h3>
            <p className="text-sm text-gray-500 mb-4">Confirma los datos de la reserva.</p>
            <p className="text-xs text-gray-400 mb-4">
              Auditorio: <strong>{auditorioSel?.name}</strong> &middot; {form.fecha} &middot; {form.horaInicio} – {form.horaFin}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmacionOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#C8171E] hover:bg-[#a01016] text-white transition"
              >
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function Campo({ label, error, children, opcional }) {
  return (
    <div>
      <label className="label-field">{label}{opcional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}</label>
      {children}
      {error && <p className="text-xs text-[#C8171E] mt-1">{error}</p>}
    </div>
  )
}

function InfoLine({ label, valor }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 flex-shrink-0">{label}:</span>
      <span className="text-gray-700 font-medium">{valor}</span>
    </div>
  )
}
