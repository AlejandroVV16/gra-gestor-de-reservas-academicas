import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useEquipos } from '../hooks/useEquipos'
import EquipoCard from '../components/equipos/EquipoCard'
import EquipoModal from '../components/equipos/EquipoModal'
import { crearEquipo, editarEquipo } from '../api/equiposApi'

export default function Equipos() {
  const { addToast } = useApp()
  const { equipos, cargando, error, recargar } = useEquipos()
  const [modal, setModal] = useState(null)

  useEffect(() => {
    if (error) addToast({ tipo: 'error', mensaje: error })
  }, [error])

  const handleGuardar = async (data) => {
    try {
      if (data.id) {
        await editarEquipo(data.id, {
          name: data.nombre,
          quantity: data.cantidad,
          description: data.descripcion,
        })
        addToast({ tipo: 'exito', mensaje: 'Equipo actualizado correctamente' })
      } else {
        await crearEquipo({
          name: data.nombre,
          quantity: data.cantidad,
          description: data.descripcion,
        })
        addToast({ tipo: 'exito', mensaje: 'Equipo creado correctamente' })
      }
      recargar()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err.response?.data?.error || 'Error al guardar equipo' })
    }
    setModal(null)
  }

  const handleToggleEstado = async (equipo) => {
    const nuevoEstado = equipo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    try {
      await editarEquipo(equipo.id, { is_active: nuevoEstado === 'ACTIVO' })
      addToast({ tipo: 'exito', mensaje: `Equipo ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}` })
      recargar()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err.response?.data?.error || 'Error al cambiar estado' })
    }
  }

  if (cargando && equipos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Equipos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{equipos.length} equipos registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('nuevo')}>
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {equipos.map((e) => (
          <EquipoCard
            key={e.id}
            equipo={e}
            onEditar={() => setModal(e)}
            onToggleEstado={handleToggleEstado}
          />
        ))}
      </div>

      {modal && (
        <EquipoModal
          equipo={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  )
}
