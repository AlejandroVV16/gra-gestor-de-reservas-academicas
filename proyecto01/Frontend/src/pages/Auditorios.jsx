import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuditorios } from '../hooks/useAuditorios'
import AuditorioCard from '../components/auditorios/AuditorioCard'
import AuditorioModal from '../components/auditorios/AuditorioModal'
import { crearAuditorio, editarAuditorio } from '../api/auditoriosApi'

export default function Auditorios() {
  const { addToast } = useApp()
  const { auditorios, cargando, error, recargar } = useAuditorios()
  const [modal, setModal] = useState(null)

  useEffect(() => {
    if (error) addToast({ tipo: 'error', mensaje: error })
  }, [error])

  const handleGuardar = async (data) => {
    try {
      const tieneArchivo = data.archivo instanceof File
      let payload

      if (tieneArchivo) {
        payload = new FormData()
        payload.append('name', data.nombre)
        payload.append('location', data.sede)
        payload.append('capacity', String(data.capacidad))
        payload.append('description', data.descripcion || '')
        payload.append('image', data.archivo)
        if (data.id) {
          payload.append('is_active', data.estado === 'ACTIVO' ? 'true' : 'false')
        }
      } else {
        payload = {
          name: data.nombre,
          location: data.sede,
          capacity: data.capacidad,
          description: data.descripcion,
        }
        if (data.id) {
          payload.is_active = data.estado === 'ACTIVO'
          const imgVal = data.imagenActual || null
          payload.image = data.imagenEliminada ? null : (imgVal && imgVal !== '{}' ? imgVal : null)
        }
      }

      if (data.id) {
        await editarAuditorio(data.id, payload)
        addToast({ tipo: 'exito', mensaje: 'Auditorio actualizado correctamente' })
      } else {
        await crearAuditorio(payload)
        addToast({ tipo: 'exito', mensaje: 'Auditorio creado correctamente' })
      }
      recargar()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err.response?.data?.error || 'Error al guardar auditorio' })
    }
    setModal(null)
  }

  const handleToggleEstado = async (auditorio) => {
    const nuevoEstado = auditorio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    try {
      await editarAuditorio(auditorio.id, { is_active: nuevoEstado === 'ACTIVO' })
      addToast({ tipo: 'exito', mensaje: `Auditorio ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}` })
      recargar()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err.response?.data?.error || 'Error al cambiar estado' })
    }
  }

  if (cargando && auditorios.length === 0) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Auditorios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{auditorios.length} auditorios registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('nuevo')}>
          <Plus size={16} /> Nuevo Auditorio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
        {auditorios.map((a) => (
          <AuditorioCard
            key={a.id}
            auditorio={a}
            onEditar={() => setModal(a)}
            onToggleEstado={handleToggleEstado}
          />
        ))}
      </div>

      {modal && (
        <AuditorioModal
          auditorio={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  )
}
