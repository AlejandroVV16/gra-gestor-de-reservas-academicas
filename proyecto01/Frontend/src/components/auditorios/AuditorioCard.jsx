import { Pencil, PowerOff, Monitor, Mic, Camera, Tv } from 'lucide-react'
import SedeBadge from '../ui/SedeBadge'

const ICONO_EQUIPO = {
  'Proyector': Monitor,
  'Micrófono': Mic,
  'Cámaras':   Camera,
  'Televisor': Tv,
}

export default function AuditorioCard({ auditorio, onEditar, onToggleEstado }) {
  const activo = auditorio.estado === 'ACTIVO'

  return (
    <div className={`card p-5 flex flex-col gap-4 transition-opacity ${activo ? '' : 'opacity-70'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#111111] text-base leading-tight">{auditorio.nombre}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <SedeBadge sede={auditorio.sede} />
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#C8171E]">{auditorio.capacidad}</p>
          <p className="text-xs text-gray-400">personas</p>
        </div>
      </div>

      {/* Descripción */}
      {auditorio.descripcion && (
        <p className="text-sm text-gray-500 leading-snug">{auditorio.descripcion}</p>
      )}

      {/* Equipamiento */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Equipamiento</p>
        <div className="flex flex-wrap gap-2">
          {auditorio.equipamiento.map((eq) => {
            const Icon = ICONO_EQUIPO[eq]
            return (
              <div key={eq} className="flex items-center gap-1.5 bg-gray-50 border border-[#E0E0E0] rounded-full px-2.5 py-1">
                {Icon && <Icon size={12} className="text-gray-500" />}
                <span className="text-xs text-gray-600">{eq}</span>
              </div>
            )
          })}
          {auditorio.equipamiento.length === 0 && (
            <span className="text-xs text-gray-400">Sin equipamiento registrado</span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1 border-t border-[#E0E0E0]">
        <button
          onClick={() => onEditar(auditorio)}
          className="btn-secondary flex-1 justify-center text-sm py-1.5"
        >
          <Pencil size={14} /> Editar
        </button>
        <button
          onClick={() => onToggleEstado(auditorio)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            activo
              ? 'border-red-200 text-[#C8171E] hover:bg-red-50'
              : 'border-green-200 text-green-700 hover:bg-green-50'
          }`}
        >
          <PowerOff size={14} />
          {activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}
