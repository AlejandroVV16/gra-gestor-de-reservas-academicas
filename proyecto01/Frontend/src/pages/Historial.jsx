import { useState, useEffect } from 'react'
import { Download, Search, Loader2, Trash2 } from 'lucide-react'
import AccionBadge from '../components/ui/AccionBadge'
import { getHistorial, limpiarHistorial } from '../api/historialApi'
import { getAuditorios } from '../api/auditoriosApi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TIPOS_ACCION = ['CREADA', 'EDITADA', 'CANCELADA', 'CONFLICTO_RESUELTO', 'APROBADA', 'PAGADA_FASE2']

export default function Historial() {
  const [filtros, setFiltros] = useState({
    fechaInicio: '', fechaFin: '', usuario: '', tipoAccion: '', auditorio: '',
  })
  const [registros, setRegistros] = useState([])
  const [todos, setTodos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [auditorios, setAuditorios] = useState([])

  useEffect(() => {
    getAuditorios()
      .then(({ data }) => setAuditorios(data))
      .catch(() => setAuditorios([]))
  }, [])

  useEffect(() => {
    setCargando(true)
    getHistorial()
      .then(({ data }) => {
        setTodos(data)
        setRegistros(data)
      })
      .catch(() => {
        setTodos([])
        setRegistros([])
      })
      .finally(() => setCargando(false))
  }, [])

  const handleChange = (e) => {
    setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleBuscar = () => {
    const filtrados = todos.filter((h) => {
      if (filtros.fechaInicio && h.fechaHora < filtros.fechaInicio) return false
      if (filtros.fechaFin    && h.fechaHora > filtros.fechaFin + 'T23:59') return false
      if (filtros.usuario && !h.usuario?.toLowerCase().includes(filtros.usuario.toLowerCase())) return false
      if (filtros.tipoAccion && h.tipoAccion !== filtros.tipoAccion) return false
      if (filtros.auditorio  && !h.auditorio?.includes(filtros.auditorio)) return false
      return true
    })
    setRegistros(filtrados)
  }

  const handleLimpiar = () => {
    if (!window.confirm('¿Estás seguro de limpiar todo el historial? Esta acción no se puede deshacer.')) return
    setCargando(true)
    limpiarHistorial()
      .then(({ data }) => {
        setTodos([])
        setRegistros([])
        alert(data.message)
      })
      .catch(() => alert('Error al limpiar el historial'))
      .finally(() => setCargando(false))
  }

  const handleExportar = () => {
    const csv = [
      ['Fecha y Hora', 'Reserva', 'Auditorio', 'Tipo Acción', 'Usuario', 'Descripción'].join(','),
      ...registros.map((r) => [
        r.fechaHora, `#${r.reservaId} - ${r.reservaNombre}`,
        r.auditorio, r.tipoAccion, r.usuario, r.descripcion,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial_${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Historial Global</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de todas las acciones del sistema — solo lectura</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportar}>
            <Download size={16} /> Exportar historial
          </button>
          <button
            onClick={handleLimpiar}
            disabled={cargando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 size={16} /> Limpiar historial
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label-field">Fecha inicio</label>
            <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleChange} className="input-field w-40" />
          </div>
          <div>
            <label className="label-field">Fecha fin</label>
            <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleChange} className="input-field w-40" />
          </div>
          <div>
            <label className="label-field">Usuario</label>
            <input type="text" name="usuario" value={filtros.usuario} onChange={handleChange} className="input-field w-36" placeholder="Nombre..." />
          </div>
          <div>
            <label className="label-field">Tipo de acción</label>
            <select name="tipoAccion" value={filtros.tipoAccion} onChange={handleChange} className="input-field w-44">
              <option value="">Todas</option>
              {TIPOS_ACCION.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Auditorio</label>
            <select name="auditorio" value={filtros.auditorio} onChange={handleChange} className="input-field w-48">
              <option value="">Todos</option>
              {auditorios.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleBuscar}>
            <Search size={16} /> Buscar
          </button>
        </div>
      </div>

      {/* Tabla historial */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                {['Fecha y Hora', 'Reserva afectada', 'Auditorio', 'Tipo acción', 'Usuario', 'Descripción del cambio'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Cargando historial...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No hay registros con los filtros aplicados
                  </td>
                </tr>
              ) : registros.map((r, i) => (
                <tr key={r.id} className={`border-b border-[#E0E0E0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                    {format(new Date(r.fechaHora), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">#{r.reservaId}</span>{' '}
                    <span className="font-medium text-gray-800">{r.reservaNombre}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.auditorio}</td>
                  <td className="px-4 py-3">
                    <AccionBadge accion={r.tipoAccion} />
                  </td>
                  <td className="px-4 py-3 font-medium">{r.usuario}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{r.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
