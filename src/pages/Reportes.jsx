import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Download, FileText, BarChart2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MOCK_AUDITORIOS, MOCK_FACULTADES, MOCK_RESERVAS } from '../data/mockData'

// Calcular datos del reporte a partir de mock
function calcularResumen(reservas) {
  const porAuditorio = {}
  MOCK_AUDITORIOS.forEach((a) => { porAuditorio[a.nombre] = 0 })
  const porFacultad = {}

  reservas.forEach((r) => {
    porAuditorio[r.auditorio] = (porAuditorio[r.auditorio] || 0) + 1
    porFacultad[r.facultad]   = (porFacultad[r.facultad]   || 0) + 1
  })

  const auditorioTop  = Object.entries(porAuditorio).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const facultadTop   = Object.entries(porFacultad).sort((a, b)  => b[1] - a[1])[0]?.[0]  || '—'
  const grafico       = Object.entries(porAuditorio).map(([nombre, reservas]) => ({ nombre: nombre.split(' ').slice(0, 2).join(' '), reservas }))

  return { total: reservas.length, auditorioTop, facultadTop, grafico, datos: reservas }
}

export default function Reportes() {
  const { addToast } = useApp()
  const [filtros, setFiltros] = useState({
    fechaInicio: '', fechaFin: '', auditorio: '', facultad: '', tipoEvento: '',
  })
  const [resumen, setResumen] = useState(null)
  const [generando, setGenerando] = useState(false)

  const handleChange = (e) => setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleGenerar = async () => {
    setGenerando(true)
    await new Promise((r) => setTimeout(r, 600)) // Simular latencia
    const filtradas = MOCK_RESERVAS.filter((r) => {
      if (filtros.auditorio && !r.auditorio.includes(filtros.auditorio)) return false
      if (filtros.facultad  && r.facultad !== filtros.facultad) return false
      return true
    })
    setResumen(calcularResumen(filtradas))
    setGenerando(false)
    addToast({ tipo: 'exito', mensaje: 'Reporte generado correctamente' })
  }

  const handleExportarCSV = () => {
    if (!resumen) return
    const csv = [
      ['N°', 'Fecha', 'H. Inicio', 'H. Fin', 'Encargado', 'Facultad', 'Auditorio', 'Evento', 'Personas', 'Estado'].join(','),
      ...resumen.datos.map((r) => [
        r.id, r.fecha, r.horaInicio, r.horaFin, r.encargado,
        r.facultad, r.auditorio, r.evento, r.personas, r.estado,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte_reservas.csv'
    a.click()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#111111]">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análisis y estadísticas de uso de auditorios</p>
      </div>

      {/* Sección A — Filtros */}
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
            <select name="auditorio" value={filtros.auditorio} onChange={handleChange} className="input-field w-48">
              <option value="">Todos</option>
              {MOCK_AUDITORIOS.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Facultad</label>
            <select name="facultad" value={filtros.facultad} onChange={handleChange} className="input-field w-48">
              <option value="">Todas</option>
              {MOCK_FACULTADES.map((f) => <option key={f} value={f}>{f}</option>)}
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
          <button className="btn-secondary" disabled={!resumen} onClick={() => addToast({ tipo: 'info', mensaje: 'Exportación PDF en desarrollo' })}>
            <FileText size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Sección B — Resultados */}
      {resumen && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiReporte label="Total reservas en período" valor={resumen.total} />
            <KpiReporte label="Auditorio más solicitado" valor={resumen.auditorioTop} pequeño />
            <KpiReporte label="Facultad con más eventos" valor={resumen.facultadTop} pequeño />
          </div>

          {/* Gráfico recharts */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-5">Reservas por Auditorio</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={resumen.grafico} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                  cursor={{ fill: '#f5f5f5' }}
                  formatter={(v) => [v, 'Reservas']}
                />
                <Bar dataKey="reservas" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {resumen.grafico.map((_, i) => (
                    <Cell key={i} fill="#C8171E" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de resultados */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E0E0E0]">
              <h2 className="font-semibold text-gray-800">Detalle de reservas en el período</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    {['N°', 'Fecha', 'Horario', 'Encargado', 'Facultad', 'Auditorio', 'Evento', 'Personas', 'Estado'].map((col) => (
                      <th key={col} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumen.datos.map((r, i) => (
                    <tr key={r.id} className={`border-b border-[#E0E0E0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
                      <td className="px-3 py-2.5 text-gray-500">#{r.id}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.fecha}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.horaInicio}–{r.horaFin}</td>
                      <td className="px-3 py-2.5">{r.encargado}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate">{r.facultad}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.auditorio}</td>
                      <td className="px-3 py-2.5 max-w-[160px] truncate">{r.evento}</td>
                      <td className="px-3 py-2.5 text-center">{r.personas}</td>
                      <td className="px-3 py-2.5">
                        <EstadoChip estado={r.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Estado vacío inicial */}
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

function EstadoChip({ estado }) {
  const map = {
    CONFIRMADA: 'bg-green-100 text-green-800',
    PENDIENTE:  'bg-yellow-100 text-yellow-800',
    CANCELADA:  'bg-red-100 text-red-800',
    CONFLICTO:  'bg-red-900/10 text-red-900',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[estado] || 'bg-gray-100 text-gray-600'}`}>
      {estado}
    </span>
  )
}
