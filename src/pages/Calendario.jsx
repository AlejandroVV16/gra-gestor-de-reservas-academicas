import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Clock, Building2, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CalendarioView from '../components/calendar/CalendarioView'
import EstadoBadge from '../components/ui/EstadoBadge'

export default function Calendario() {
  const { esAdmin } = useAuth()
  const navigate = useNavigate()
  const [eventoSel, setEventoSel] = useState(null)

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
          onFechaClick={(fecha) => navigate(`/reservas/nueva?fecha=${fecha}`)}
          esAdmin={esAdmin}
        />
      </div>

      {/* Modal detalle evento */}
      {eventoSel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-start justify-between p-5 border-b border-[#E0E0E0]">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Reserva #{eventoSel.id}</p>
                <h3 className="font-bold text-lg text-[#111111]">{eventoSel.evento}</h3>
              </div>
              <button onClick={() => setEventoSel(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <EstadoBadge estado={eventoSel.estado} />
              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-600">{eventoSel.horaInicio} – {eventoSel.horaFin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400" />
                  <span className="text-gray-600">{eventoSel.auditorio}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-gray-600">{eventoSel.personas} personas</span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Encargado: </span>
                <span className="font-medium">{eventoSel.encargado}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Facultad: </span>
                <span className="font-medium">{eventoSel.facultad}</span>
              </div>
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
    </div>
  )
}
