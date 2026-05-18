import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import AuditorioCard from '../components/auditorios/AuditorioCard'
import AuditorioModal from '../components/auditorios/AuditorioModal'
import { MOCK_AUDITORIOS } from '../data/mockData'
import { crearAuditorio, editarAuditorio } from '../api/auditoriosApi'

export default function Auditorios() {
  const { addToast } = useApp()
  const [auditorios, setAuditorios] = useState(MOCK_AUDITORIOS)
  const [modal, setModal] = useState(null) // null | 'nuevo' | { ...auditorio }

  const handleGuardar = async (data) => {
    try {
      if (data.id) {
        await editarAuditorio(data.id, data)
        setAuditorios((prev) => prev.map((a) => a.id === data.id ? { ...a, ...data } : a))
        addToast({ tipo: 'exito', mensaje: 'Auditorio actualizado correctamente' })
      } else {
        await crearAuditorio(data)
        setAuditorios((prev) => [...prev, { ...data, id: Date.now() }])
        addToast({ tipo: 'exito', mensaje: 'Auditorio creado correctamente' })
      }
    } catch {
      // Mock: actualizar estado local
      if (data.id) {
        setAuditorios((prev) => prev.map((a) => a.id === data.id ? { ...a, ...data } : a))
      } else {
        setAuditorios((prev) => [...prev, { ...data, id: Date.now() }])
      }
      addToast({ tipo: 'exito', mensaje: data.id ? 'Auditorio actualizado (prototipo)' : 'Auditorio creado (prototipo)' })
    }
    setModal(null)
  }

  const handleToggleEstado = async (auditorio) => {
    const nuevoEstado = auditorio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    try {
      await editarAuditorio(auditorio.id, { estado: nuevoEstado })
    } catch { /* mock */ }
    setAuditorios((prev) =>
      prev.map((a) => a.id === auditorio.id ? { ...a, estado: nuevoEstado } : a)
    )
    addToast({ tipo: 'exito', mensaje: `Auditorio ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}` })
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

      {/* Grid de auditorios */}
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

      {/* Modal */}
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
