import { useState } from 'react'
import { Pencil, Ban, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import EstadoBadge from '../ui/EstadoBadge'
import Avatar from '../ui/Avatar'
import ReservaModal from './ReservaModal'
import { useNavigate } from 'react-router-dom'

// Color de fondo sutil por auditorio
function accentRow(auditorio) {
  if (auditorio?.includes('Benjamín')) return 'bg-[#fff5f5]'
  if (auditorio?.includes('Rodrigo'))  return 'bg-[#f0f4ff]'
  return ''
}

export default function TablaReservas({
  reservas = [], cargando, esAdmin, onCancelar,
  page, pages, onPageChange,
}) {
  const navigate = useNavigate()
  const [expandida, setExpandida] = useState(null)
  const [modalReserva, setModalReserva] = useState(null)

  const toggleExpand = (id) => setExpandida((prev) => (prev === id ? null : id))

  if (cargando) return <SkeletonTabla />

  return (
    <>
      {/* Tabla desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {['N°', 'H. Inicio', 'H. Fin', 'Encargado', 'Facultad', 'Auditorio', 'Evento', 'Personas', 'Personal TI', 'Estado', ...(esAdmin ? ['Acciones'] : [])].map((col) => (
                <th key={col} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservas.length === 0 ? (
              <tr>
                <td colSpan={esAdmin ? 11 : 10} className="text-center py-16">
                  <EmptyState />
                </td>
              </tr>
            ) : reservas.map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-[#E0E0E0] cursor-pointer hover:brightness-95 transition-all ${accentRow(r.auditorio) || (i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]')}`}
                onClick={() => setModalReserva(r)}
              >
                <td className="px-3 py-3 font-medium text-gray-500">#{r.id}</td>
                <td className="px-3 py-3 font-medium">{r.horaInicio}</td>
                <td className="px-3 py-3 text-gray-600">{r.horaFin}</td>
                <td className="px-3 py-3">{r.encargado}</td>
                <td className="px-3 py-3 text-gray-600 max-w-[120px] truncate">{r.facultad}</td>
                <td className="px-3 py-3">
                  <span className="font-medium text-gray-800">{r.auditorio}</span>
                  {r.secciones?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.secciones.map((s) => (
                        <span
                          key={s}
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#C8A84B]/15 text-[#8a6e22] border border-[#C8A84B]/30"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 max-w-[160px] truncate">{r.evento}</td>
                <td className="px-3 py-3 text-center">{r.personas}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {r.personalTI?.map((p) => (
                      <Avatar key={p.id} nombre={p.nombre} apellido={p.apellido} size="sm" />
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <EstadoBadge estado={r.estado} />
                </td>
                {esAdmin && (
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/reservas/${r.id}/editar`)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onCancelar(r.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-[#C8171E]"
                        title="Cancelar"
                      >
                        <Ban size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista móvil (accordion) */}
      <div className="lg:hidden divide-y divide-[#E0E0E0]">
        {reservas.length === 0 ? (
          <div className="py-12"><EmptyState /></div>
        ) : reservas.map((r) => (
          <div key={r.id} className={accentRow(r.auditorio)}>
            {/* Fila colapsada */}
            <div
              className="flex items-center gap-2 px-3 py-3 cursor-pointer"
              onClick={() => toggleExpand(r.id)}
            >
              <span className="text-gray-400 text-xs w-6">#{r.id}</span>
              <span className="font-medium text-sm flex-1">{r.horaInicio}</span>
              <span className="text-sm text-gray-600 flex-1 truncate">{r.auditorio}</span>
              <EstadoBadge estado={r.estado} />
              {expandida === r.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>

            {/* Accordion expandido */}
            {expandida === r.id && (
              <div className="px-3 pb-3 space-y-2 text-sm bg-white/60">
                <Row label="Hora fin" valor={r.horaFin} />
                <Row label="Encargado" valor={r.encargado} />
                <Row label="Facultad" valor={r.facultad} />
                <Row label="Evento" valor={r.evento} />
                <Row label="Personas" valor={r.personas} />
                {r.secciones?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-500 w-24 flex-shrink-0">Secciones:</span>
                    {r.secciones.map((s) => (
                      <span
                        key={s}
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#C8A84B]/15 text-[#8a6e22] border border-[#C8A84B]/30"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {r.personalTI?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Personal TI:</span>
                    {r.personalTI.map((p) => (
                      <Avatar key={p.id} nombre={p.nombre} apellido={p.apellido} size="sm" />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setModalReserva(r)} className="btn-secondary text-xs py-1.5 px-3">
                    <Eye size={13} /> Ver detalle
                  </button>
                  {esAdmin && (
                    <>
                      <button onClick={() => navigate(`/reservas/${r.id}/editar`)} className="btn-primary text-xs py-1.5 px-3">
                        <Pencil size={13} /> Editar
                      </button>
                      <button onClick={() => onCancelar(r.id)} className="btn-secondary text-xs py-1.5 px-3 text-[#C8171E]">
                        <Ban size={13} /> Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1 p-4 border-t border-[#E0E0E0]">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded text-sm border border-[#E0E0E0] disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-[#C8171E] text-white' : 'border border-[#E0E0E0] hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === pages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded text-sm border border-[#E0E0E0] disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal detalle */}
      {modalReserva && (
        <ReservaModal
          reserva={modalReserva}
          onClose={() => setModalReserva(null)}
          onEditar={(id) => navigate(`/reservas/${id}/editar`)}
          onCancelar={onCancelar}
          esAdmin={esAdmin}
        />
      )}
    </>
  )
}

function Row({ label, valor }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-gray-500 w-24 flex-shrink-0">{label}:</span>
      <span className="text-gray-800">{valor}</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <Eye size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">No hay reservas</p>
      <p className="text-gray-400 text-sm">Ajusta los filtros o crea una nueva reserva</p>
    </div>
  )
}

function SkeletonTabla() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-10 rounded" />
      ))}
    </div>
  )
}
