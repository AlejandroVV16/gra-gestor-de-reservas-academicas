import { useState, useMemo } from 'react'
import {
  Eye, ChevronDown, ChevronUp, Search, ExternalLink,
} from 'lucide-react'
import SolicitudExternaModal from '../components/solicitudes/SolicitudExternaModal'
import { MOCK_SOLICITUDES_EXTERNAS } from '../data/mockData'

// ── Badges de estado ─────────────────────────────────────────────────────────

const CFG_ESTADO = {
  PENDIENTE:  { bg: '#ca8a04', label: 'Pendiente'  },
  APROBADA:   { bg: '#16a34a', label: 'Aprobada'   },
  RECHAZADA:  { bg: '#dc2626', label: 'Rechazada'  },
  CANCELADA:  { bg: '#6b7280', label: 'Cancelada'  },
}

const CFG_PAGO = {
  PENDIENTE_PAGO: { bg: '#ca8a04', label: 'Pago pendiente' },
  PAGADO:         { bg: '#16a34a', label: 'Pagado'         },
  EXENTO:         { bg: '#2563eb', label: 'Exento'         },
}

function EstadoBadge({ cfg, valor }) {
  const c = cfg[valor?.toUpperCase()] || { bg: '#6b7280', label: valor || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  )
}

// ── Filtros ──────────────────────────────────────────────────────────────────

const ESTADOS_FILTRO = ['Todos', 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA']
const SEDES_FILTRO   = ['Todas', 'CENTRO', 'BELMONTE']

function Filtros({ filtros, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      {/* Búsqueda */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar entidad, evento o NIT..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="w-full pl-9 pr-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 focus:border-[#C8171E]"
        />
      </div>

      {/* Estado */}
      <select
        value={filtros.estado}
        onChange={(e) => onChange({ ...filtros, estado: e.target.value })}
        className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30"
      >
        {ESTADOS_FILTRO.map((e) => (
          <option key={e} value={e}>{e === 'Todos' ? 'Todos los estados' : CFG_ESTADO[e]?.label}</option>
        ))}
      </select>

      {/* Sede */}
      <select
        value={filtros.sede}
        onChange={(e) => onChange({ ...filtros, sede: e.target.value })}
        className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30"
      >
        {SEDES_FILTRO.map((s) => (
          <option key={s} value={s}>{s === 'Todas' ? 'Todas las sedes' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
        ))}
      </select>

      {/* Fecha desde */}
      <input
        type="date"
        value={filtros.fechaDesde}
        onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
        className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30"
        title="Fecha desde"
      />

      {/* Fecha hasta */}
      <input
        type="date"
        value={filtros.fechaHasta}
        onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
        className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30"
        title="Fecha hasta"
      />
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <ExternalLink size={24} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">No hay solicitudes externas</p>
      <p className="text-gray-400 text-sm">Ajusta los filtros o espera nuevas solicitudes</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded" />
      ))}
    </div>
  )
}

// ── Tabla desktop ─────────────────────────────────────────────────────────────

const COLS = ['N°', 'Entidad', 'Evento', 'Auditorio', 'Fecha', 'Estado', 'Pago', 'Acciones']

function TablaDesktop({ solicitudes, onVerDetalle }) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            {COLS.map((c) => (
              <th key={c} className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {solicitudes.length === 0 ? (
            <tr>
              <td colSpan={COLS.length}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            solicitudes.map((s, i) => (
              <tr
                key={s.id}
                className={`border-b border-[#E0E0E0] cursor-pointer hover:brightness-95 transition-all ${
                  i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'
                }`}
                onClick={() => onVerDetalle(s)}
              >
                <td className="px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                  {s.id}
                </td>
                <td className="px-3 py-3 max-w-[160px]">
                  <p className="font-medium text-gray-800 truncate">
                    {s.nombreEntidad || s.nombreContacto}
                  </p>
                  {s.nit && (
                    <p className="text-xs text-gray-400 font-mono">{s.nit}</p>
                  )}
                </td>
                <td className="px-3 py-3 max-w-[160px] truncate">{s.nombreEvento}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-gray-800">{s.auditorio}</span>
                  <p className="text-xs text-gray-400">
                    {s.sede.charAt(0) + s.sede.slice(1).toLowerCase()}
                  </p>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <p className="text-gray-800">{s.fecha}</p>
                  <p className="text-xs text-gray-400">
                    {s.horaInicio} – {s.horaFin}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <EstadoBadge cfg={CFG_ESTADO} valor={s.estado} />
                </td>
                <td className="px-3 py-3">
                  <EstadoBadge cfg={CFG_PAGO} valor={s.estadoPago} />
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onVerDetalle(s)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                    title="Ver detalle"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Lista móvil ───────────────────────────────────────────────────────────────

function ListaMobil({ solicitudes, onVerDetalle }) {
  const [expandida, setExpandida] = useState(null)
  const toggle = (id) => setExpandida((p) => (p === id ? null : id))

  return (
    <div className="lg:hidden divide-y divide-[#E0E0E0]">
      {solicitudes.length === 0 ? (
        <EmptyState />
      ) : (
        solicitudes.map((s) => (
          <div key={s.id}>
            <div
              className="flex items-center gap-2 px-3 py-3 cursor-pointer"
              onClick={() => toggle(s.id)}
            >
              <span className="text-gray-400 text-xs w-14 flex-shrink-0">{s.id}</span>
              <span className="font-medium text-sm flex-1 truncate">
                {s.nombreEntidad || s.nombreContacto}
              </span>
              <EstadoBadge cfg={CFG_ESTADO} valor={s.estado} />
              {expandida === s.id
                ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </div>
            {expandida === s.id && (
              <div className="px-3 pb-3 space-y-1.5 text-sm bg-white/60">
                <p><span className="text-gray-500">Evento:</span> {s.nombreEvento}</p>
                <p><span className="text-gray-500">Auditorio:</span> {s.auditorio}</p>
                <p><span className="text-gray-500">Fecha:</span> {s.fecha} {s.horaInicio}–{s.horaFin}</p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Pago:</span>
                  <EstadoBadge cfg={CFG_PAGO} valor={s.estadoPago} />
                </div>
                <button
                  onClick={() => onVerDetalle(s)}
                  className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#E0E0E0] rounded-lg hover:bg-gray-50"
                >
                  <Eye size={13} /> Ver detalle
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SolicitudesExternas() {
  const [solicitudes, setSolicitudes] = useState(MOCK_SOLICITUDES_EXTERNAS)
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'Todos',
    sede: 'Todas',
    fechaDesde: '',
    fechaHasta: '',
  })
  const [modalSolicitud, setModalSolicitud] = useState(null)

  const filtradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const bq = filtros.busqueda.toLowerCase()
      if (
        bq &&
        !s.nombreEntidad?.toLowerCase().includes(bq) &&
        !s.nombreContacto?.toLowerCase().includes(bq) &&
        !s.nombreEvento?.toLowerCase().includes(bq) &&
        !s.nit?.toLowerCase().includes(bq) &&
        !s.id?.toLowerCase().includes(bq)
      ) return false
      if (filtros.estado !== 'Todos' && s.estado !== filtros.estado) return false
      if (filtros.sede !== 'Todas' && s.sede !== filtros.sede) return false
      if (filtros.fechaDesde && s.fecha < filtros.fechaDesde) return false
      if (filtros.fechaHasta && s.fecha > filtros.fechaHasta) return false
      return true
    })
  }, [solicitudes, filtros])

  const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length

  const handleActualizar = (actualizada) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === actualizada.id ? actualizada : s))
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111111]">Solicitudes Externas</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión de reservas por entidades externas
          </p>
        </div>
        {pendientes > 0 && (
          <span className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
            {pendientes} pendiente{pendientes > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filtros */}
      <Filtros filtros={filtros} onChange={setFiltros} />

      {/* Tabla / lista */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E0E0E0]">
        <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#111111]">{filtradas.length}</span> solicitud{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <TablaDesktop solicitudes={filtradas} onVerDetalle={setModalSolicitud} />
        <ListaMobil solicitudes={filtradas} onVerDetalle={setModalSolicitud} />
      </div>

      {/* Modal */}
      {modalSolicitud && (
        <SolicitudExternaModal
          solicitud={modalSolicitud}
          onClose={() => setModalSolicitud(null)}
          onActualizar={handleActualizar}
        />
      )}
    </div>
  )
}
