import { useState } from 'react'
import { Plus, Pencil, PowerOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Avatar from '../components/ui/Avatar'
import RolBadge from '../components/ui/RolBadge'
import UsuarioModal from '../components/personal/UsuarioModal'
import { MOCK_USUARIOS } from '../data/mockData'
import { crearUsuario, editarUsuario } from '../api/usuariosApi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Personal() {
  const { addToast } = useApp()
  const [usuarios, setUsuarios] = useState(MOCK_USUARIOS)
  const [modal, setModal] = useState(null) // null | 'nuevo' | { ...usuario }

  const handleGuardar = async (data) => {
    try {
      if (data.id) {
        await editarUsuario(data.id, data)
      } else {
        await crearUsuario(data)
      }
    } catch { /* mock */ }

    if (data.id) {
      setUsuarios((prev) => prev.map((u) => u.id === data.id ? { ...u, ...data } : u))
      addToast({ tipo: 'exito', mensaje: 'Usuario actualizado correctamente' })
    } else {
      setUsuarios((prev) => [...prev, { ...data, id: Date.now(), ultimaConexion: null }])
      addToast({ tipo: 'exito', mensaje: 'Usuario creado correctamente' })
    }
    setModal(null)
  }

  const handleToggle = async (usuario) => {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    try { await editarUsuario(usuario.id, { estado: nuevoEstado }) } catch { /* mock */ }
    setUsuarios((prev) => prev.map((u) => u.id === usuario.id ? { ...u, estado: nuevoEstado } : u))
    addToast({ tipo: 'exito', mensaje: `Usuario ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}` })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Personal</h1>
          <p className="text-sm text-gray-500 mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('nuevo')}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                {['', 'Nombre completo', 'Usuario institucional', 'Rol', 'Estado', 'Última conexión', 'Acciones'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={u.id} className={`border-b border-[#E0E0E0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
                  <td className="px-4 py-3">
                    <Avatar nombre={u.nombre} apellido={u.apellido} size="md" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#111111]">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-gray-400">{u.correo}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600 text-xs">{u.usuario}</td>
                  <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(u)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${u.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={u.estado === 'ACTIVO' ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${u.estado === 'ACTIVO' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {u.ultimaConexion
                      ? format(new Date(u.ultimaConexion), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModal(u)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggle(u)}
                        className={`p-1.5 rounded ${u.estado === 'ACTIVO' ? 'hover:bg-red-50 text-[#C8171E]' : 'hover:bg-green-50 text-green-600'}`}
                        title={u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      >
                        <PowerOff size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista móvil */}
        <div className="lg:hidden divide-y divide-[#E0E0E0]">
          {usuarios.map((u) => (
            <div key={u.id} className="p-4 flex items-start gap-3">
              <Avatar nombre={u.nombre} apellido={u.apellido} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#111111]">{u.nombre} {u.apellido}</p>
                <p className="text-xs text-gray-400 truncate">{u.correo}</p>
                <div className="flex gap-2 mt-1.5">
                  <RolBadge rol={u.rol} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {u.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <button onClick={() => setModal(u)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <UsuarioModal
          usuario={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  )
}
