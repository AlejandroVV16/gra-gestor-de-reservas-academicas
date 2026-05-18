import { Search, Filter } from 'lucide-react'
import { MOCK_AUDITORIOS, MOCK_FACULTADES } from '../../data/mockData'

export default function FiltrosPanel({ filtros, onChange, onBuscar, compact = false }) {
  const handleChange = (e) => onChange({ ...filtros, [e.target.name]: e.target.value })

  if (compact) {
    // Versión drawer móvil — mismos campos pero apilados
    return (
      <div className="space-y-3 p-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter size={16} /> Filtros
        </h3>
        <Inputs filtros={filtros} onChange={handleChange} />
        <button className="btn-primary w-full justify-center" onClick={onBuscar}>
          <Search size={16} /> Buscar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Inputs filtros={filtros} onChange={handleChange} />
      <button className="btn-primary" onClick={onBuscar}>
        <Search size={16} /> Buscar
      </button>
    </div>
  )
}

function Inputs({ filtros, onChange }) {
  return (
    <>
      <div>
        <label className="label-field">Fecha</label>
        <input
          type="date"
          name="fecha"
          value={filtros.fecha || ''}
          onChange={onChange}
          className="input-field w-40"
        />
      </div>

      <div>
        <label className="label-field">Auditorio</label>
        <select name="auditorio" value={filtros.auditorio || ''} onChange={onChange} className="input-field w-48">
          <option value="">Todos</option>
          {MOCK_AUDITORIOS.map((a) => (
            <option key={a.id} value={a.nombre}>{a.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-field">Facultad</label>
        <select name="facultad" value={filtros.facultad || ''} onChange={onChange} className="input-field w-48">
          <option value="">Todas</option>
          {MOCK_FACULTADES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </>
  )
}
