import { useState, useMemo, useEffect } from 'react'
import {
  Eye, ChevronDown, ChevronUp, Search, ExternalLink,
} from 'lucide-react'
import EstadoBadge from '../components/ui/EstadoBadge'
import SolicitudExternaModal from '../components/solicitudes/SolicitudExternaModal'
import { getSolicitudesExternas } from '../api/solicitudesExternasApi'

const mapSolicitud = (s) => ({
  id: s.id,
  nombreEntidad: s.nombre_entidad,
  tipoEntidad: s.tipo_entidad,
  nit: s.nit,
  nombreContacto: s.nombre_contacto,
  cargoContacto: s.cargo_contacto,
  correoContacto: s.correo_contacto,
  telefonoContacto: s.telefono_contacto,
  sede: s.sede,
  auditorio: s.auditorio_nombre,
  auditorioNombre: s.auditorio_nombre,
  fecha: s.fecha,
  horaInicio: s.hora_inicio,
  horaFin: s.hora_fin,
  nombreEvento: s.nombre_evento,
  tipoEvento: s.tipo_evento,
  descripcionEvento: s.descripcion_evento,
  numAsistentes: s.num_asistentes,
  requiereEquipos: s.requiere_equipos,
  estado: s.estado,
  estadoPago: s.estado_pago,
  tarifaAplicada: s.tarifa_aplicada,
  montoFase1: s.monto_fase1,
  referenciaFase1: s.referencia_fase1,
  montoFase2: s.monto_fase2,
  referenciaFase2: s.referencia_fase2,
  notaAdmin: s.nota_admin,
  fechaSolicitud: s.fecha_solicitud,
  reservationId: s.reservation_id,
})

const CFG_ESTADO = {
  PENDIENTE:    { bg: '#ca8a04', label: 'Pendiente'     },
  PRE_APROBADA: { bg: '#2563eb', label: 'Pre-aprobada'  },
  APROBADA:     { bg: '#16a34a', label: 'Aprobada'      },
  RECHAZADA:    { bg: '#dc2626', label: 'Rechazada'     },
  CANCELADA:    { bg: '#6b7280', label: 'Cancelada'     },
}

const CFG_PAGO = {
  PENDIENTE_PAGO: { bg: '#ca8a04', label: 'Pago pendiente' },
  PARCIAL:        { bg: '#2563eb', label: 'Pago parcial'    },
  PAGADO:         { bg: '#16a34a', label: 'Pagado'          },
  EXENTO:         { bg: '#6b7280', label: 'Exento'          },
}

const ESTADOS_FILTRO = ['Todos', 'PENDIENTE', 'PRE_APROBADA', 'APROBADA', 'RECHAZADA', 'CANCELADA']
const SEDES_FILTRO   = ['Todas', 'CENTRO', 'BELMONTE']

function Filtros({ filtros, onChange }) {
  const inputCls = 'border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 focus:border-[#C8171E]'
  return (
    <div className="flex flex-wrap items-end gap-2 mb-5">

      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <Search size={14} className="absolute left-3 bottom-2.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Entidad, evento, NIT..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className={`${inputCls} w-full pl-8 pr-3`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
        <select
          value={filtros.estado}
          onChange={(e) => onChange({ ...filtros, estado: e.target.value })}
          className={inputCls}
        >
          {ESTADOS_FILTRO.map((e) => (
            <option key={e} value={e}>
              {e === 'Todos' ? 'Todos' : CFG_ESTADO[e]?.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Sede</label>
        <select
          value={filtros.sede}
          onChange={(e) => onChange({ ...filtros, sede: e.target.value })}
          className={inputCls}
        >
          {SEDES_FILTRO.map((s) => (
            <option key={s} value={s}>
              {s === 'Todas' ? 'Todas' : s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )
}

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

const COLS = ['N°', 'Entidad', 'Evento', 'Auditorio', 'Fecha', 'Estado', 'Pago', 'Acciones']

function TablaDesktop({ solicitudes, onVerDetalle }) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-xs min-w-[820px]">
        <thead>
          <tr className="table-header">
            {COLS.map((c) => (
              <th key={c} className="px-2.5 py-2.5 text-left font-semibold whitespace-nowrap">
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
                <td className="px-2.5 py-2 font-medium text-gray-500 whitespace-nowrap">
                  {s.id}
                </td>
                <td className="px-2.5 py-2 max-w-[160px]">
                  <p className="font-medium text-gray-800 truncate">
                    {s.nombreEntidad || s.nombreContacto}
                  </p>
                  {s.nit && (
                    <p className="text-xs text-gray-400 font-mono">{s.nit}</p>
                  )}
                </td>
                <td className="px-2.5 py-2 max-w-[160px] truncate">{s.nombreEvento}</td>
                <td className="px-2.5 py-2 whitespace-nowrap">
                  <span className="text-gray-800">{s.auditorio}</span>
                  <p className="text-xs text-gray-400">
                    {s.sede.charAt(0) + s.sede.slice(1).toLowerCase()}
                  </p>
                </td>
                <td className="px-2.5 py-2 whitespace-nowrap">
                  <p className="text-gray-800">{s.fecha}</p>
                  <p className="text-xs text-gray-400">
                    {s.horaInicio} – {s.horaFin}
                  </p>
                </td>
                <td className="px-2.5 py-2">
                  <EstadoBadge cfg={CFG_ESTADO} valor={s.estado} />
                </td>
                <td className="px-2.5 py-2">
                  <EstadoBadge cfg={CFG_PAGO} valor={s.estadoPago} />
                </td>
                <td className="px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
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

export default function SolicitudesExternas() {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'Todos',
    sede: 'Todas',
    fechaDesde: '',
    fechaHasta: '',
  })
  const [modalSolicitud, setModalSolicitud] = useState(null)

  useEffect(() => {
    setCargando(true)
    getSolicitudesExternas()
      .then(({ data }) => setSolicitudes(data.map(mapSolicitud)))
      .catch(() => setSolicitudes([]))
      .finally(() => setCargando(false))
  }, [])

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

  const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE' || s.estado === 'PRE_APROBADA').length

  const handleActualizar = (actualizada) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === actualizada.id ? actualizada : s))
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
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

      <Filtros filtros={filtros} onChange={setFiltros} />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E0E0E0]">
        <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#111111]">{filtradas.length}</span> solicitud{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <TablaDesktop solicitudes={filtradas} onVerDetalle={setModalSolicitud} />
        <ListaMobil solicitudes={filtradas} onVerDetalle={setModalSolicitud} />
      </div>

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
