import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { getAuditorios } from '../../api/auditoriosApi'

export default function FiltrosPanel({ filtros, onChange, onBuscar, compact = false }) {
  const [auditorios, setAuditorios] = useState([])

  useEffect(() => {
    getAuditorios()
      .then(({ data }) => setAuditorios(data))
      .catch(() => {})
  }, [])

  const handleChange = (e) => onChange({ ...filtros, [e.target.name]: e.target.value })

  if (compact) {
    return (
      <div className="space-y-3 p-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter size={16} /> Filtros
        </h3>
        <Inputs filtros={filtros} onChange={handleChange} auditorios={auditorios} />
        <button className="btn-primary w-full justify-center" onClick={onBuscar}>
          <Search size={16} /> Buscar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Inputs filtros={filtros} onChange={handleChange} auditorios={auditorios} />
      <button className="btn-primary" onClick={onBuscar}>
        <Search size={16} /> Buscar
      </button>
    </div>
  )
}

function Inputs({ filtros, onChange, auditorios }) {
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
          {auditorios.map((a) => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-field">Facultad</label>
        <select name="facultad" value={filtros.facultad || ''} onChange={onChange} className="input-field w-48">
          <option value="">Todas</option>
          {['Ingeniería', 'Ciencias de la Salud', 'Derecho', 'Ciencias Económicas', 'Ciencias Educación'].map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </>
  )
}
