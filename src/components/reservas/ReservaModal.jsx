import { useEffect, useState } from 'react'
import { X, Calendar, Clock, Users, Building2, Pencil, Ban } from 'lucide-react'
import EstadoBadge from '../ui/EstadoBadge'
import AccionBadge from '../ui/AccionBadge'
import Avatar from '../ui/Avatar'
import { getHistorialReserva } from '../../api/reservasApi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ReservaModal({ reserva, onClose, onEditar, onCancelar, esAdmin }) {
  const [historial, setHistorial] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  useEffect(() => {
    if (!reserva) return
    setCargandoHistorial(true)
    getHistorialReserva(reserva.id)
      .then(({ data }) => setHistorial(data))
      .catch(() => setHistorial([
        { fecha: '2026-05-16T08:30:00', accion: 'CREADA',  usuario: 'Lindelia', descripcion: 'Reserva creada' },
        { fecha: '2026-05-16T10:00:00', accion: 'EDITADA', usuario: 'Lindelia', descripcion: 'Cambio de estado' },
      ]))
      .finally(() => setCargandoHistorial(false))
  }, [reserva?.id])

  if (!reserva) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header modal */}
        <div className="flex items-start justify-between p-5 border-b border-[#E0E0E0]">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Detalle de Reserva #{reserva.id}</p>
            <h3 className="font-bold text-lg text-[#111111]">{reserva.evento}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">
          {/* Estado */}
          <div className="flex items-center gap-2">
            <EstadoBadge estado={reserva.estado} />
          </div>

          {/* Info principal */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoItem icon={Calendar} label="Fecha" valor={reserva.fecha} />
            <InfoItem icon={Clock} label="Horario" valor={`${reserva.horaInicio} – ${reserva.horaFin}`} />
            <InfoItem icon={Building2} label="Auditorio" valor={reserva.auditorio} />
            <InfoItem icon={Users} label="Personas" valor={reserva.personas} />
          </div>

          <div className="text-sm">
            <span className="text-gray-500 font-medium">Encargado:</span>{' '}
            <span className="text-gray-800">{reserva.encargado}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500 font-medium">Facultad:</span>{' '}
            <span className="text-gray-800">{reserva.facultad}</span>
          </div>

          {/* Secciones (Rodrigo Rivera dividido) */}
          {reserva.secciones?.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">Secciones reservadas:</p>
              <div className="flex gap-1.5 flex-wrap">
                {reserva.secciones.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C8A84B]/15 text-[#7a5f10] border border-[#C8A84B]/35"
                  >
                    {s === 'SI' && 'Superior Izq.'}
                    {s === 'SD' && 'Superior Der.'}
                    {s === 'II' && 'Inferior Izq.'}
                    {s === 'ID' && 'Inferior Der.'}
                    {!['SI','SD','II','ID'].includes(s) && s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personal TI asignado */}
          {reserva.personalTI?.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">Personal TI asignado:</p>
              <div className="flex gap-2 flex-wrap">
                {reserva.personalTI.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1">
                    <Avatar nombre={p.nombre} apellido={p.apellido} size="sm" />
                    <span className="text-xs text-gray-700">{p.nombre} {p.apellido}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de cambios */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 border-t border-[#E0E0E0] pt-3">
              Historial de cambios
            </p>
            {cargandoHistorial ? (
              <div className="space-y-2">
                {[1,2].map((i) => <div key={i} className="skeleton h-8 rounded" />)}
              </div>
            ) : (
              <ul className="space-y-2">
                {historial.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <AccionBadge accion={h.accion} />
                    <span className="flex-1">
                      <span className="font-medium">{h.usuario}</span> — {h.descripcion}
                    </span>
                    <span className="text-gray-400 whitespace-nowrap">
                      {format(new Date(h.fecha), 'dd/MM HH:mm', { locale: es })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        {esAdmin && (
          <div className="flex gap-2 p-5 border-t border-[#E0E0E0]">
            <button
              onClick={() => { onEditar(reserva.id); onClose() }}
              className="btn-primary flex-1 justify-center"
            >
              <Pencil size={15} /> Editar
            </button>
            <button
              onClick={() => { onCancelar(reserva.id); onClose() }}
              className="btn-secondary flex-1 justify-center text-[#C8171E] border-[#C8171E]/30"
            >
              <Ban size={15} /> Cancelar reserva
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-gray-800 font-medium">{valor}</p>
      </div>
    </div>
  )
}
