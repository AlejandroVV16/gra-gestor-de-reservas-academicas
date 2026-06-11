import { Pencil, PowerOff, Package } from 'lucide-react'

export default function EquipoCard({ equipo, onEditar, onToggleEstado }) {
  const activo = equipo.estado === 'ACTIVO'

  return (
    <div className={`card p-5 flex flex-col gap-4 transition-opacity ${activo ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Package size={20} className="text-gray-500" />
          </div>
          <div>
            <h3 className="font-bold text-[#111111] text-base leading-tight">{equipo.nombre}</h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {activo ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#C8171E]">{equipo.cantidad}</p>
          <p className="text-xs text-gray-400">disponibles</p>
        </div>
      </div>

      {equipo.descripcion && (
        <p className="text-sm text-gray-500 leading-snug">{equipo.descripcion}</p>
      )}

      <div className="flex gap-2 pt-1 border-t border-[#E0E0E0]">
        <button
          onClick={() => onEditar(equipo)}
          className="btn-secondary flex-1 justify-center text-sm py-1.5"
        >
          <Pencil size={14} /> Editar
        </button>
        <button
          onClick={() => onToggleEstado(equipo)}
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
