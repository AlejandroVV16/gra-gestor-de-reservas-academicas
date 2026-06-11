import { useState, useEffect } from 'react'
import { X, Save, Upload, Trash2 } from 'lucide-react'

const EQUIPOS_DISPONIBLES = ['Proyector', 'Micrófono', 'Cámaras', 'Televisor', 'Puntero láser', 'Tablero digital']

const FORM_VACIO = {
  nombre: '', sede: 'CENTRO', capacidad: '', descripcion: '',
  equipamiento: [], estado: 'ACTIVO',
}

export default function AuditorioModal({ auditorio, onClose, onGuardar }) {
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [archivo, setArchivo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imagenEliminada, setImagenEliminada] = useState(false)

  useEffect(() => {
    if (auditorio) {
      setForm({
        nombre:       auditorio.nombre,
        sede:         auditorio.sede,
        capacidad:    String(auditorio.capacidad),
        descripcion:  auditorio.descripcion || '',
        equipamiento: auditorio.equipamiento || [],
        estado:       auditorio.estado,
      })
      if (auditorio.image) {
        setPreviewUrl(`/uploads/auditorios/${auditorio.image}`)
      }
    } else {
      setForm(FORM_VACIO)
      setPreviewUrl(null)
    }
    setArchivo(null)
    setImagenEliminada(false)
    setErrores({})
  }, [auditorio])

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrores((p) => ({ ...p, [name]: '' }))
  }

  const toggleEquipo = (eq) =>
    setForm((p) => ({
      ...p,
      equipamiento: p.equipamiento.includes(eq)
        ? p.equipamiento.filter((e) => e !== eq)
        : [...p.equipamiento, eq],
    }))

  const handleArchivoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setArchivo(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const eliminarImagen = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setArchivo(null)
    setPreviewUrl(null)
    setImagenEliminada(true)
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim())   e.nombre    = 'Requerido'
    if (!form.capacidad || Number(form.capacidad) < 1) e.capacidad = 'Capacidad inválida'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    onGuardar({
      ...form,
      capacidad: Number(form.capacidad),
      id: auditorio?.id,
      equipamiento: form.equipamiento,
      archivo,
      imagenActual: (auditorio?.image && auditorio.image !== '{}') ? auditorio.image : null,
      imagenEliminada,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#E0E0E0]">
          <h3 className="font-bold text-lg text-[#111111]">
            {auditorio ? 'Editar Auditorio' : 'Nuevo Auditorio'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="label-field">Nombre del auditorio</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Ej: Auditorium Central" />
            {errores.nombre && <p className="text-xs text-[#C8171E] mt-1">{errores.nombre}</p>}
          </div>

          {/* Sede y capacidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Sede</label>
              <select name="sede" value={form.sede} onChange={handleChange} className="input-field">
                <option value="CENTRO">Centro</option>
                <option value="BELMONTE">Belmonte</option>
              </select>
            </div>
            <div>
              <label className="label-field">Capacidad (personas)</label>
              <input type="number" name="capacidad" value={form.capacidad} onChange={handleChange}
                className="input-field" min={1} placeholder="0" />
              {errores.capacidad && <p className="text-xs text-[#C8171E] mt-1">{errores.capacidad}</p>}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label-field">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              className="input-field resize-none" rows={2} placeholder="Descripción breve (opcional)" />
          </div>

          {/* Equipamiento */}
          <div>
            <label className="label-field">Equipamiento disponible</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EQUIPOS_DISPONIBLES.map((eq) => (
                <button key={eq} type="button" onClick={() => toggleEquipo(eq)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.equipamiento.includes(eq)
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-gray-600 border-[#E0E0E0] hover:border-gray-400'
                  }`}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-3">
            <label className="label-field mb-0">Estado:</label>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, estado: p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.estado === 'ACTIVO' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-600">{form.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span>
          </div>

          {/* Imagen */}
          <div>
            <label className="label-field">Foto del auditorio</label>
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E0E0E0]">
                <img src={previewUrl} alt="Vista previa" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={eliminarImagen}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition"
                >
                  <Trash2 size={16} className="text-[#C8171E]" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-6 flex flex-col items-center gap-2 text-sm text-gray-400 hover:border-[#C8A84B] cursor-pointer transition-colors">
                <Upload size={24} className="text-gray-300" />
                <span>Haz clic para subir imagen</span>
                <span className="text-xs">JPEG, PNG, GIF o WebP — Máx 5 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleArchivoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Acciones */}
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
