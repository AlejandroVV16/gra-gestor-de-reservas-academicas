import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

const FORM_VACIO = {
  nombre: '', cantidad: '', descripcion: '',
}

export default function EquipoModal({ equipo, onClose, onGuardar }) {
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (equipo) {
      setForm({
        nombre: equipo.nombre,
        cantidad: String(equipo.cantidad),
        descripcion: equipo.descripcion || '',
      })
    } else {
      setForm(FORM_VACIO)
    }
    setErrores({})
  }, [equipo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrores((p) => ({ ...p, [name]: '' }))
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (form.cantidad === '' || isNaN(Number(form.cantidad)) || Number(form.cantidad) < 0) {
      e.cantidad = 'Cantidad inválida'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    onGuardar({
      nombre: form.nombre.trim(),
      cantidad: Number(form.cantidad),
      descripcion: form.descripcion.trim() || null,
      id: equipo?.id,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#E0E0E0]">
          <h3 className="font-bold text-lg text-[#111111]">
            {equipo ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label-field">Nombre del equipo</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Ej: Mesas en fórmica" />
            {errores.nombre && <p className="text-xs text-[#C8171E] mt-1">{errores.nombre}</p>}
          </div>

          <div>
            <label className="label-field">Cantidad disponible</label>
            <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange}
              className="input-field" min={0} placeholder="0" />
            {errores.cantidad && <p className="text-xs text-[#C8171E] mt-1">{errores.cantidad}</p>}
          </div>

          <div>
            <label className="label-field">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              className="input-field resize-none" rows={2} placeholder="Descripción breve (opcional)" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Save size={16} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
