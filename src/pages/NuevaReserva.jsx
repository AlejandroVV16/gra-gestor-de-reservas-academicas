import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Building2, Calendar, LayoutGrid, Maximize2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { crearReserva } from '../api/reservasApi'
import { getDisponibilidad } from '../api/auditoriosApi'
import ConflictoAlert from '../components/reservas/ConflictoAlert'
import SelectorSecciones from '../components/reservas/SelectorSecciones'
import { MOCK_AUDITORIOS, MOCK_USUARIOS, MOCK_FACULTADES, MOCK_TIPOS_EVENTO } from '../data/mockData'
import Avatar from '../components/ui/Avatar'

const EQUIPOS = ['Proyector', 'Micrófono', 'Cámaras', 'Televisor', 'Puntero láser']

const FORM_INICIAL = {
  fecha: '', horaInicio: '', horaFin: '', auditorioId: '',
  encargado: '', facultad: '', tipoEvento: '', nombreEvento: '',
  descripcion: '', personas: '', equipos: [], personalTI: [],
  usarSecciones: false, secciones: [],
}

export default function NuevaReserva() {
  const navigate = useNavigate()
  const { addToast } = useApp()

  const [form, setForm] = useState(FORM_INICIAL)
  const [conflictos, setConflictos] = useState([])
  const [verificando, setVerificando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})

  const auditorioSel = MOCK_AUDITORIOS.find((a) => a.id === Number(form.auditorioId))
  const esDivisible  = auditorioSel?.divisible === true

  // Capacidad efectiva según modo
  const capacidadEfectiva = form.usarSecciones && esDivisible
    ? (auditorioSel?.secciones || [])
        .filter((s) => form.secciones.includes(s.id))
        .reduce((acc, s) => acc + s.capacidad, 0)
    : auditorioSel?.capacidad || 999

  // Al cambiar de auditorio: resetear secciones
  const handleAuditorioChange = (e) => {
    const nuevoId = e.target.value
    const nuevo = MOCK_AUDITORIOS.find((a) => a.id === Number(nuevoId))
    setForm((p) => ({
      ...p,
      auditorioId: nuevoId,
      usarSecciones: false,
      secciones: [],
    }))
    setErrores((p) => ({ ...p, auditorioId: '' }))
    // resetear personas si supera capacidad del nuevo auditorio
    if (nuevo && form.personas && Number(form.personas) > nuevo.capacidad) {
      setForm((p) => ({ ...p, auditorioId: nuevoId, personas: String(nuevo.capacidad), usarSecciones: false, secciones: [] }))
    }
  }

  const toggleUsarSecciones = () => {
    setForm((p) => ({
      ...p,
      usarSecciones: !p.usarSecciones,
      secciones: [],
      personas: '',
    }))
  }

  // Verificar disponibilidad en tiempo real
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
      // Mock: simular sin conflictos
      setConflictos([])
    } finally {
      setVerificando(false)
    }
  }, [form.auditorioId, form.fecha, form.horaInicio, form.horaFin])

  useEffect(() => {
    verificarDisponibilidad()
  }, [verificarDisponibilidad])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrores((p) => ({ ...p, [name]: '' }))
  }

  const toggleEquipo = (eq) =>
    setForm((p) => ({
      ...p,
      equipos: p.equipos.includes(eq) ? p.equipos.filter((e) => e !== eq) : [...p.equipos, eq],
    }))

  const togglePersonalTI = (usuario) =>
    setForm((p) => ({
      ...p,
      personalTI: p.personalTI.find((u) => u.id === usuario.id)
        ? p.personalTI.filter((u) => u.id !== usuario.id)
        : [...p.personalTI, usuario],
    }))

  const validar = () => {
    const e = {}
    if (!form.fecha)        e.fecha       = 'Campo requerido'
    if (!form.horaInicio)   e.horaInicio  = 'Campo requerido'
    if (!form.horaFin)      e.horaFin     = 'Campo requerido'
    if (!form.auditorioId)  e.auditorioId = 'Selecciona un auditorio'
    if (!form.encargado.trim()) e.encargado = 'Campo requerido'
    if (!form.facultad)     e.facultad    = 'Campo requerido'
    if (!form.nombreEvento.trim()) e.nombreEvento = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleGuardar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      await crearReserva(form)
      addToast({ tipo: 'exito', mensaje: 'Reserva creada exitosamente' })
      navigate('/reservas')
    } catch {
      addToast({ tipo: 'exito', mensaje: 'Reserva creada (modo prototipo)' })
      navigate('/reservas')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Nueva Reserva</h1>
          <p className="text-sm text-gray-500 mt-0.5">Completa los datos de la reserva</p>
        </div>
        <button onClick={() => navigate('/reservas')} className="btn-secondary">
          <X size={16} /> Cancelar
        </button>
      </div>

      {/* Alerta de conflicto */}
      <ConflictoAlert conflictos={conflictos} auditorio={auditorioSel?.nombre} />

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Columna formulario (60%) */}
        <div className="lg:col-span-3 card p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 border-b border-[#E0E0E0] pb-3">
            Información de la reserva
          </h2>

          {/* Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo label="Fecha" error={errores.fecha}>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="input-field" />
            </Campo>
            <Campo label="Hora inicio" error={errores.horaInicio}>
              <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} className="input-field" />
            </Campo>
            <Campo label="Hora fin" error={errores.horaFin}>
              <input type="time" name="horaFin" value={form.horaFin} onChange={handleChange} className="input-field" />
            </Campo>
          </div>

          {/* Auditorio */}
          <Campo label="Auditorio" error={errores.auditorioId}>
            <select name="auditorioId" value={form.auditorioId} onChange={handleAuditorioChange} className="input-field">
              <option value="">Selecciona auditorio</option>
              {MOCK_AUDITORIOS.filter((a) => a.estado === 'ACTIVO').map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} — {a.capacidad} personas</option>
              ))}
            </select>
            {verificando && <p className="text-xs text-gray-400 mt-1">Verificando disponibilidad...</p>}
          </Campo>

          {/* Panel de secciones — solo para auditorios divisibles */}
          {esDivisible && (
            <div className="rounded-xl border border-[#C8A84B]/40 bg-[#C8A84B]/5 p-4 space-y-3">
              {/* Toggle sala completa / secciones */}
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

              {/* Plano interactivo */}
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

              {/* Modo sala completa: mostrar resumen */}
              {!form.usarSecciones && (
                <div className="flex items-center justify-between text-xs text-gray-600 bg-white/70 rounded-lg px-3 py-2">
                  <span>Usando el auditorio completo</span>
                  <span className="font-semibold text-[#C8A84B]">{auditorioSel.capacidad} personas</span>
                </div>
              )}
            </div>
          )}

          {/* Encargado y Facultad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Encargado" error={errores.encargado}>
              <input type="text" name="encargado" value={form.encargado} onChange={handleChange} className="input-field" placeholder="Nombre del encargado" />
            </Campo>
            <Campo label="Facultad" error={errores.facultad}>
              <select name="facultad" value={form.facultad} onChange={handleChange} className="input-field">
                <option value="">Selecciona facultad</option>
                {MOCK_FACULTADES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Campo>
          </div>

          {/* Tipo y nombre evento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Tipo de evento">
              <select name="tipoEvento" value={form.tipoEvento} onChange={handleChange} className="input-field">
                <option value="">Selecciona tipo</option>
                {MOCK_TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Campo>
            <Campo label="Nombre del evento" error={errores.nombreEvento}>
              <input type="text" name="nombreEvento" value={form.nombreEvento} onChange={handleChange} className="input-field" placeholder="Nombre del evento" />
            </Campo>
          </div>

          {/* Descripción */}
          <Campo label="Descripción">
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="input-field resize-none"
              rows={3}
              placeholder="Descripción del evento (opcional)"
            />
          </Campo>

          {/* Cantidad de personas */}
          <Campo label="Cantidad de personas">
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
                    : `${auditorioSel.capacidad} personas`}
                </strong>
              </p>
            )}
          </Campo>

          {/* Equipos */}
          <div>
            <label className="label-field">Equipos requeridos</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EQUIPOS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipo(eq)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.equipos.includes(eq)
                      ? 'bg-[#C8171E] text-white border-[#C8171E]'
                      : 'bg-white text-gray-600 border-[#E0E0E0] hover:border-[#C8171E]'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Personal TI */}
          <div>
            <label className="label-field">Personal TI asignado</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MOCK_USUARIOS.filter((u) => u.rol === 'PERSONAL_TI' && u.estado === 'ACTIVO').map((u) => {
                const seleccionado = form.personalTI.find((p) => p.id === u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => togglePersonalTI(u)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm border transition-colors ${
                      seleccionado
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-gray-600 border-[#E0E0E0] hover:border-gray-400'
                    }`}
                  >
                    <Avatar nombre={u.nombre} apellido={u.apellido} size="sm" />
                    {u.nombre} {u.apellido}
                    {seleccionado && <span className="ml-0.5">×</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha — panel auditorio (40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Imagen / info auditorio */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-[#C8171E]" />
              {auditorioSel ? auditorioSel.nombre : 'Selecciona un auditorio'}
            </h3>
            {auditorioSel ? (
              <>
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  <Building2 size={48} className="text-gray-300" />
                </div>
                <div className="space-y-1.5 text-sm">
                  <InfoLine label="Sede" valor={auditorioSel.sede} />
                  <InfoLine
                    label="Capacidad"
                    valor={
                      form.usarSecciones && esDivisible
                        ? `${capacidadEfectiva} personas (${form.secciones.length} secc.)`
                        : `${auditorioSel.capacidad} personas`
                    }
                  />
                  <InfoLine label="Equipamiento" valor={auditorioSel.equipamiento.join(', ')} />
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
                Selecciona un auditorio para ver su disponibilidad
              </div>
            )}
          </div>

          {/* Mini-calendario referencia */}
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

      {/* Footer acciones */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => navigate('/reservas')} className="btn-secondary">
          <X size={16} /> Cancelar
        </button>
        <button
          onClick={handleGuardar}
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
  )
}

function Campo({ label, error, children }) {
  return (
    <div>
      <label className="label-field">{label}</label>
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
