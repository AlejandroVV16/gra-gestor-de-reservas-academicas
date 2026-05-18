import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import AccionBadge from '../components/ui/AccionBadge'
import { MOCK_HISTORIAL, MOCK_AUDITORIOS, MOCK_USUARIOS } from '../data/mockData'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TIPOS_ACCION = ['CREADA', 'EDITADA', 'CANCELADA', 'CONFLICTO_RESUELTO']

export default function Historial() {
  const [filtros, setFiltros] = useState({
    fechaInicio: '', fechaFin: '', usuario: '', tipoAccion: '', auditorio: '',
  })
  const [registros, setRegistros] = useState(MOCK_HISTORIAL)

  const handleChange = (e) => {
    setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleBuscar = () => {
    const filtrados = MOCK_HISTORIAL.filter((h) => {
      if (filtros.fechaInicio && h.fechaHora < filtros.fechaInicio) return false
      if (filtros.fechaFin    && h.fechaHora > filtros.fechaFin + 'T23:59') return false
      if (filtros.usuario && !h.usuario.toLowerCase().includes(filtros.usuario.toLowerCase())) return false
      if (filtros.tipoAccion && h.tipoAccion !== filtros.tipoAccion) return false
      if (filtros.auditorio  && !h.auditorio.includes(filtros.auditorio)) return false
      return true
    })
    setRegistros(filtrados)
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
        <button className="btn-secondary" onClick={handleExportar}>
          <Download size={16} /> Exportar historial
        </button>
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
              {MOCK_AUDITORIOS.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
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
              {registros.length === 0 ? (
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
