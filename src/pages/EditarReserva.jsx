import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X, Building2, Calendar, LayoutGrid, Maximize2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getReserva, editarReserva } from '../api/reservasApi'
import { getDisponibilidad } from '../api/auditoriosApi'
import ConflictoAlert from '../components/reservas/ConflictoAlert'
import SelectorSecciones from '../components/reservas/SelectorSecciones'
import { MOCK_AUDITORIOS, MOCK_USUARIOS, MOCK_FACULTADES, MOCK_TIPOS_EVENTO, MOCK_RESERVAS } from '../data/mockData'
import Avatar from '../components/ui/Avatar'

const EQUIPOS = ['Proyector', 'Micrófono', 'Cámaras', 'Televisor', 'Puntero láser']

export default function EditarReserva() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useApp()

  const [form, setForm] = useState(null)
  const [conflictos, setConflictos] = useState([])
  const [verificando, setVerificando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [errores, setErrores] = useState({})

  // Cargar reserva existente
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await getReserva(id)
        setForm({
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          horaFin: data.horaFin,
          auditorioId: String(MOCK_AUDITORIOS.find((a) => a.nombre === data.auditorio)?.id || ''),
          encargado: data.encargado,
          facultad: data.facultad,
          tipoEvento: data.tipoEvento || '',
          nombreEvento: data.evento,
          descripcion: data.descripcion || '',
          personas: String(data.personas),
          equipos: data.equipos || [],
          personalTI: data.personalTI || [],
          usarSecciones: (data.secciones?.length > 0) || false,
          secciones: data.secciones || [],
        })
      } catch {
        // Mock fallback
        const r = MOCK_RESERVAS.find((r) => r.id === Number(id))
        if (r) {
          setForm({
            fecha: r.fecha,
            horaInicio: r.horaInicio,
            horaFin: r.horaFin,
            auditorioId: String(MOCK_AUDITORIOS.find((a) => a.nombre === r.auditorio)?.id || ''),
            encargado: r.encargado,
            facultad: r.facultad,
            tipoEvento: '',
            nombreEvento: r.evento,
            descripcion: '',
            personas: String(r.personas),
            equipos: [],
            personalTI: r.personalTI || [],
            usarSecciones: (r.secciones?.length > 0) || false,
            secciones: r.secciones || [],
          })
        }
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  const auditorioSel = MOCK_AUDITORIOS.find((a) => a.id === Number(form?.auditorioId))
  const esDivisible  = auditorioSel?.divisible === true

  const capacidadEfectiva = form?.usarSecciones && esDivisible
    ? (auditorioSel?.secciones || [])
        .filter((s) => form.secciones.includes(s.id))
        .reduce((acc, s) => acc + s.capacidad, 0)
    : auditorioSel?.capacidad || 999

  const handleAuditorioChange = (e) => {
    const nuevoId = e.target.value
    setForm((p) => ({ ...p, auditorioId: nuevoId, usarSecciones: false, secciones: [], personas: '' }))
    setErrores((p) => ({ ...p, auditorioId: '' }))
  }

  const toggleUsarSecciones = () => {
    setForm((p) => ({ ...p, usarSecciones: !p.usarSecciones, secciones: [], personas: '' }))
  }

  const verificarDisponibilidad = useCallback(async () => {
    if (!form?.auditorioId || !form?.fecha || !form?.horaInicio || !form?.horaFin) return
    setVerificando(true)
    try {
      const { data } = await getDisponibilidad(form.auditorioId, {
        fecha: form.fecha, hora_inicio: form.horaInicio, hora_fin: form.horaFin,
      })
      setConflictos(data.disponible ? [] : data.conflictos)
    } catch {
      setConflictos([])
    } finally {
      setVerificando(false)
    }
  }, [form?.auditorioId, form?.fecha, form?.horaInicio, form?.horaFin])

  useEffect(() => { if (form) verificarDisponibilidad() }, [verificarDisponibilidad, form?.auditorioId, form?.fecha, form?.horaInicio, form?.horaFin]) // eslint-disable-line

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
    if (!form.fecha)            e.fecha       = 'Campo requerido'
    if (!form.horaInicio)       e.horaInicio  = 'Campo requerido'
    if (!form.horaFin)          e.horaFin     = 'Campo requerido'
    if (!form.auditorioId)      e.auditorioId = 'Selecciona un auditorio'
    if (!form.encargado?.trim()) e.encargado  = 'Campo requerido'
    if (!form.facultad)         e.facultad    = 'Campo requerido'
    if (!form.nombreEvento?.trim()) e.nombreEvento = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleGuardar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      await editarReserva(id, form)
      addToast({ tipo: 'exito', mensaje: 'Reserva actualizada exitosamente' })
      navigate('/reservas')
    } catch {
      addToast({ tipo: 'exito', mensaje: 'Reserva actualizada (modo prototipo)' })
      navigate('/reservas')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#C8171E]/20 border-t-[#C8171E] rounded-full animate-spin" />
    </div>
  )
  if (!form) return (
    <div className="card p-8 text-center text-gray-500">Reserva no encontrada</div>
  )

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Editar Reserva #{id}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modifica los datos de la reserva</p>
        </div>
        <button onClick={() => navigate('/reservas')} className="btn-secondary">
          <X size={16} /> Cancelar
        </button>
      </div>

      <ConflictoAlert conflictos={conflictos} auditorio={auditorioSel?.nombre} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 border-b border-[#E0E0E0] pb-3">Información de la reserva</h2>

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
                  <span className="font-semibold text-[#C8A84B]">{auditorioSel.capacidad} personas</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Encargado" error={errores.encargado}>
              <input type="text" name="encargado" value={form.encargado} onChange={handleChange} className="input-field" />
            </Campo>
            <Campo label="Facultad" error={errores.facultad}>
              <select name="facultad" value={form.facultad} onChange={handleChange} className="input-field">
                <option value="">Selecciona facultad</option>
                {MOCK_FACULTADES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Tipo de evento">
              <select name="tipoEvento" value={form.tipoEvento} onChange={handleChange} className="input-field">
                <option value="">Selecciona tipo</option>
                {MOCK_TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Campo>
            <Campo label="Nombre del evento" error={errores.nombreEvento}>
              <input type="text" name="nombreEvento" value={form.nombreEvento} onChange={handleChange} className="input-field" />
            </Campo>
          </div>

          <Campo label="Descripción">
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="input-field resize-none" rows={3} />
          </Campo>

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

          <div>
            <label className="label-field">Equipos requeridos</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EQUIPOS.map((eq) => (
                <button key={eq} type="button" onClick={() => toggleEquipo(eq)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.equipos.includes(eq) ? 'bg-[#C8171E] text-white border-[#C8171E]' : 'bg-white text-gray-600 border-[#E0E0E0] hover:border-[#C8171E]'}`}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Personal TI asignado</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MOCK_USUARIOS.filter((u) => u.rol === 'PERSONAL_TI' && u.estado === 'ACTIVO').map((u) => {
                const sel = form.personalTI.find((p) => p.id === u.id)
                return (
                  <button key={u.id} type="button" onClick={() => togglePersonalTI(u)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm border transition-colors ${sel ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-600 border-[#E0E0E0] hover:border-gray-400'}`}>
                    <Avatar nombre={u.nombre} apellido={u.apellido} size="sm" />
                    {u.nombre} {u.apellido}
                    {sel && <span className="ml-0.5">×</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-[#C8171E]" />
              {auditorioSel ? auditorioSel.nombre : 'Selecciona un auditorio'}
            </h3>
            {auditorioSel ? (
              <>
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3">
                  <Building2 size={48} className="text-gray-300" />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-2"><span className="text-gray-400 w-24">Sede:</span><span className="font-medium">{auditorioSel.sede}</span></div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24">Capacidad:</span>
                    <span className="font-medium">
                      {form.usarSecciones && esDivisible
                        ? `${capacidadEfectiva} pers. (${form.secciones.length} secc.)`
                        : `${auditorioSel.capacidad} personas`}
                    </span>
                  </div>
                  {esDivisible && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-24">Modo:</span>
                      <span className="font-medium text-[#C8A84B]">
                        {form.usarSecciones ? `Dividido` : 'Sala completa'}
                      </span>
                    </div>
                  )}
                  {conflictos.length > 0
                    ? <p className="text-xs text-[#C8171E] font-medium mt-2">● No disponible en ese horario</p>
                    : (form.fecha && form.horaInicio && form.horaFin) && <p className="text-xs text-green-600 font-medium mt-2">● Disponible</p>
                  }
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                Selecciona un auditorio
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[#C8171E]" /> Fecha
            </h3>
            {form.fecha ? (
              <div className="text-center">
                <p className="text-3xl font-bold text-[#C8171E]">
                  {new Date(form.fecha + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric' })}
                </p>
                <p className="text-gray-600 font-medium capitalize">
                  {new Date(form.fecha + 'T00:00').toLocaleDateString('es-CO', { weekday: 'long', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ) : <p className="text-sm text-gray-400 text-center py-4">Sin fecha</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={() => navigate('/reservas')} className="btn-secondary"><X size={16} /> Cancelar</button>
        <button onClick={handleGuardar} disabled={guardando || conflictos.length > 0}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
          {guardando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
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
