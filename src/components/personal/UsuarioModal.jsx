import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

const FORM_VACIO = {
  nombre: '', apellido: '', correo: '', usuario: '',
  contrasena: '', rol: 'PERSONAL_TI', estado: 'ACTIVO',
}

export default function UsuarioModal({ usuario, onClose, onGuardar }) {
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre:     usuario.nombre,
        apellido:   usuario.apellido,
        correo:     usuario.correo,
        usuario:    usuario.usuario,
        contrasena: '',
        rol:        usuario.rol,
        estado:     usuario.estado,
      })
    } else {
      setForm(FORM_VACIO)
    }
    setErrores({})
  }, [usuario])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrores((p) => ({ ...p, [name]: '' }))
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim())   e.nombre   = 'Requerido'
    if (!form.apellido.trim()) e.apellido  = 'Requerido'
    if (!form.usuario.trim())  e.usuario   = 'Requerido'
    if (!form.correo.trim()) {
      e.correo = 'Requerido'
    } else if (!form.correo.endsWith('@unilibre.edu.co')) {
      e.correo = 'El correo debe terminar en @unilibre.edu.co'
    }
    if (!usuario && !form.contrasena.trim()) e.contrasena = 'Ingresa una contraseña inicial'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    onGuardar({ ...form, id: usuario?.id })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#E0E0E0]">
          <h3 className="font-bold text-lg text-[#111111]">
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Nombre</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                className="input-field" placeholder="Nombre" />
              {errores.nombre && <p className="text-xs text-[#C8171E] mt-1">{errores.nombre}</p>}
            </div>
            <div>
              <label className="label-field">Apellido</label>
              <input type="text" name="apellido" value={form.apellido} onChange={handleChange}
                className="input-field" placeholder="Apellido" />
              {errores.apellido && <p className="text-xs text-[#C8171E] mt-1">{errores.apellido}</p>}
            </div>
          </div>

          <div>
            <label className="label-field">Correo institucional</label>
            <input type="email" name="correo" value={form.correo} onChange={handleChange}
              className="input-field" placeholder="usuario@unilibre.edu.co" />
            {errores.correo && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="text-[#C8171E]" />
                <p className="text-xs text-[#C8171E]">{errores.correo}</p>
              </div>
            )}
          </div>

          <div>
            <label className="label-field">Usuario institucional</label>
            <input type="text" name="usuario" value={form.usuario} onChange={handleChange}
              className="input-field" placeholder="usuario" />
            {errores.usuario && <p className="text-xs text-[#C8171E] mt-1">{errores.usuario}</p>}
          </div>

          <div>
            <label className="label-field">
              {usuario ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña inicial'}
            </label>
            <input type="password" name="contrasena" value={form.contrasena} onChange={handleChange}
              className="input-field" placeholder="••••••••" />
            {errores.contrasena && <p className="text-xs text-[#C8171E] mt-1">{errores.contrasena}</p>}
          </div>

          <div>
            <label className="label-field">Rol</label>
            <select name="rol" value={form.rol} onChange={handleChange} className="input-field">
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="PERSONAL_TI">Personal TI</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="label-field mb-0">Estado:</label>
            <button type="button"
              onClick={() => setForm((p) => ({ ...p, estado: p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.estado === 'ACTIVO' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-600">{form.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Save size={16} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
