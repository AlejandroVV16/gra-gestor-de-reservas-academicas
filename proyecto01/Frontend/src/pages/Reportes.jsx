import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Download, FileText, BarChart2, RotateCcw, Trash2 } from 'lucide-react'
import EstadoBadge from '../components/ui/EstadoBadge'
import { getResumen, exportarReporte, limpiarDatos } from '../api/reportesApi'
import { getAuditorios } from '../api/auditoriosApi'

export default function Reportes() {
  const [filtros, setFiltros] = useState({
    fechaInicio: '', fechaFin: '', auditorium_id: '', status: '',
  })
  const [auditorios, setAuditorios] = useState([])
  const [resumen, setResumen] = useState(null)
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    getAuditorios()
      .then(({ data }) => setAuditorios(data))
      .catch(() => setAuditorios([]))
  }, [])

  const handleChange = (e) => setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleGenerar = async () => {
    setGenerando(true)
    try {
      const params = {}
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin
      if (filtros.auditorium_id) params.auditorium_id = filtros.auditorium_id
      if (filtros.status) params.status = filtros.status
      const { data } = await getResumen(params)
      setResumen(data)
    } catch {
      setResumen(null)
    } finally {
      setGenerando(false)
    }
  }

  const handleLimpiar = () => {
    setFiltros({ fechaInicio: '', fechaFin: '', auditorium_id: '', status: '' })
    setResumen(null)
  }

  const handleEliminar = async () => {
    if (!window.confirm('¿Estás seguro? Se eliminarán todas las reservas, pagos e historial. Esta acción no se puede deshacer.')) return
    try {
      await limpiarDatos()
      setResumen(null)
    } catch {
      // silencioso
    }
  }

  const handleExportarCSV = async () => {
    try {
      const params = {}
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin
      if (filtros.auditorium_id) params.auditorium_id = filtros.auditorium_id
      if (filtros.status) params.status = filtros.status
      const response = await exportarReporte(params)
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reporte_reservas.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#111111]">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análisis y estadísticas de uso de auditorios</p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-[#C8171E]" /> Filtros y generación
        </h2>
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
            <label className="label-field">Auditorio</label>
            <select name="auditorium_id" value={filtros.auditorium_id} onChange={handleChange} className="input-field w-48">
              <option value="">Todos</option>
              {auditorios.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Estado</label>
            <select name="status" value={filtros.status} onChange={handleChange} className="input-field w-40">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="btn-primary" onClick={handleGenerar} disabled={generando}>
            {generando
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <BarChart2 size={16} />}
            {generando ? 'Generando...' : 'Generar Reporte'}
          </button>
          <button className="btn-secondary" onClick={handleExportarCSV} disabled={!resumen}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn-secondary" disabled={!resumen} onClick={() => {}}>
            <FileText size={16} /> Exportar PDF
          </button>
          <button className="btn-secondary" onClick={handleLimpiar}>
            <RotateCcw size={16} /> Limpiar
          </button>
          <button className="btn-danger" onClick={handleEliminar} disabled={generando}>
            <Trash2 size={16} /> Eliminar datos
          </button>
        </div>
      </div>

      {resumen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiReporte label="Total reservas en el período" valor={resumen.total} />
            <KpiReporte label="Auditorio más solicitado" valor={resumen.auditorioTop} pequeño />
            <KpiReporte label="Facultad con más eventos" valor="—" pequeño />
          </div>

          {resumen.porAuditorio?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-5">Reservas por Auditorio</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={resumen.porAuditorio} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                  <XAxis dataKey="auditorio" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                    cursor={{ fill: '#f5f5f5' }}
                    formatter={(v) => [v, 'Reservas']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {resumen.porAuditorio.map((_, i) => (
                      <Cell key={i} fill="#C8171E" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E0E0E0]">
              <h2 className="font-semibold text-gray-800">Detalle de reservas en el período</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    {['N°', 'Inicio', 'Fin', 'Encargado', 'Auditorio', 'Evento', 'Asistentes', 'Estado'].map((col) => (
                      <th key={col} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumen.datos.map((r, i) => {
                    const inicio = r.event_start
                      ? new Date(r.event_start).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                      : '—'
                    const fin = r.event_end
                      ? new Date(r.event_end).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                      : '—'
                    return (
                      <tr key={r.id} className={`border-b border-[#E0E0E0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
                        <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{r.id?.slice(0, 8)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{inicio}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fin}</td>
                        <td className="px-3 py-2.5">{r.responsible_person || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{r.auditorium_name || '—'}</td>
                        <td className="px-3 py-2.5 max-w-[160px] truncate">{r.event_name}</td>
                        <td className="px-3 py-2.5 text-center">{r.attendees_count}</td>
                        <td className="px-3 py-2.5"><EstadoBadge estado={r.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!resumen && !generando && (
        <div className="card p-12 text-center">
          <BarChart2 size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Configura los filtros y genera el reporte</p>
          <p className="text-gray-400 text-sm mt-1">Los resultados aparecerán aquí</p>
        </div>
      )}
    </div>
  )
}

function KpiReporte({ label, valor, pequeño }) {
  return (
    <div className="card p-5 border-l-4 border-l-[#C8171E]">
      <p className={`font-bold text-[#111111] ${pequeño ? 'text-lg' : 'text-4xl'} leading-tight`}>{valor}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}
