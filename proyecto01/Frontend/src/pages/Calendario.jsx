import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Clock, Building2, Users, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CalendarioView from '../components/calendar/CalendarioView'
import TimelineDiario from '../components/reservas/TimelineDiario'
import EstadoBadge from '../components/ui/EstadoBadge'
import { getAuditorios } from '../api/auditoriosApi'

function val(e, campoMock, campoReal) {
  const v = e?.[campoReal] ?? e?.[campoMock]
  return v ?? ''
}

function formatHora(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function Calendario() {
  const { esAdmin } = useAuth()
  const navigate = useNavigate()
  const [eventoSel, setEventoSel] = useState(null)
  const [diaSel, setDiaSel] = useState(null)
  const [auditorios, setAuditorios] = useState([])
  const [auditorioIdSel, setAuditorioIdSel] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await getAuditorios()
        setAuditorios(data)
      } catch {
        setAuditorios([])
      }
    }
    cargar()
  }, [])

  const handleFechaClick = (fecha) => {
    setDiaSel(fecha)
    setAuditorioIdSel(auditorios.length > 0 ? String(auditorios[0].id) : '')
  }

  const handleTimeSelect = ({ horaInicio, horaFin }) => {
    setDiaSel(null)
    navigate(`/reservas/nueva?fecha=${diaSel}&horaInicio=${horaInicio}&horaFin=${horaFin}&auditorioId=${auditorioIdSel}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Calendario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista de disponibilidad de auditorios</p>
        </div>
        {esAdmin && (
          <button className="btn-primary" onClick={() => navigate('/reservas/nueva')}>
            + Nueva Reserva
          </button>
        )}
      </div>

      <div className="card p-5">
        <CalendarioView
          onEventClick={(reserva) => setEventoSel(reserva)}
          onFechaClick={handleFechaClick}
          esAdmin={esAdmin}
        />
      </div>

      {/* Modal detalle evento */}
      {eventoSel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-start justify-between p-5 border-b border-[#E0E0E0]">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Reserva #{eventoSel.id?.slice(0, 8)}</p>
                <h3 className="font-bold text-lg text-[#111111]">{val(eventoSel, 'evento', 'event_name')}</h3>
              </div>
              <button onClick={() => setEventoSel(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <EstadoBadge estado={eventoSel.status || eventoSel.estado} />
              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {formatHora(val(eventoSel, 'horaInicio', 'event_start'))} – {formatHora(val(eventoSel, 'horaFin', 'event_end'))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400" />
                  <span className="text-gray-600">{val(eventoSel, 'auditorio', 'auditorium_name')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-gray-600">{val(eventoSel, 'personas', 'attendees_count')} personas</span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Responsable: </span>
                <span className="font-medium">{val(eventoSel, 'encargado', 'responsible_person')}</span>
              </div>
              {val(eventoSel, 'facultad', 'location') && (
                <div className="text-sm">
                  <span className="text-gray-500">Ubicación: </span>
                  <span className="font-medium">{val(eventoSel, 'facultad', 'location')}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 border-t border-[#E0E0E0]">
              <button onClick={() => setEventoSel(null)} className="btn-secondary flex-1 justify-center">
                Cerrar
              </button>
              {esAdmin && (
                <button
                  onClick={() => { navigate(`/reservas/${eventoSel.id}/editar`); setEventoSel(null) }}
                  className="btn-primary flex-1 justify-center"
                >
                  Ver detalle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal selección de día */}
      {diaSel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-[#E0E0E0] sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-[#C8171E]" />
                <div>
                  <h3 className="font-bold text-lg text-[#111111]">
                    {new Date(diaSel + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Selecciona un horario disponible para crear una reserva</p>
                </div>
              </div>
              <button onClick={() => setDiaSel(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Selector de auditorio */}
              <div>
                <label className="label-field">Auditorio</label>
                <select
                  value={auditorioIdSel}
                  onChange={(e) => setAuditorioIdSel(e.target.value)}
                  className="input-field"
                >
                  {auditorios.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.location}</option>
                  ))}
                </select>
              </div>

              {/* Timeline */}
              {auditorioIdSel && (
                <div className="border border-[#E0E0E0] rounded-lg p-3">
                  <TimelineDiario
                    auditorioId={auditorioIdSel}
                    fecha={diaSel}
                    onTimeSelect={handleTimeSelect}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
