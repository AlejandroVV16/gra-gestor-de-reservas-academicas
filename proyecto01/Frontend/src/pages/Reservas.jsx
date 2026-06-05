import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, Filter, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useReservas } from '../hooks/useReservas'
import FiltrosPanel from '../components/reservas/FiltrosPanel'
import TablaReservas from '../components/reservas/TablaReservas'
import { cancelarReserva } from '../api/reservasApi'

export default function Reservas() {
  const { esAdmin } = useAuth()
  const { addToast } = useApp()
  const navigate = useNavigate()

  const [filtros, setFiltros] = useState({ fecha: '', auditorio: '', facultad: '' })
  const [filtrosMobile, setFiltrosMobile] = useState(false)

  const { reservas, total, page, pages, setPage, cargando, error, recargar } = useReservas()

  useEffect(() => {
    if (error) addToast({ tipo: 'error', mensaje: error })
  }, [error])

  const handleBuscar = () => {
    recargar({ ...filtros })
  }

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) return
    try {
      await cancelarReserva(id)
      addToast({ tipo: 'exito', mensaje: 'Reserva cancelada correctamente' })
      recargar()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err.response?.data?.error || 'Error al cancelar reserva' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Reservas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} reservas encontradas</p>
        </div>
        <div className="flex gap-2">
          <button
            className="lg:hidden btn-secondary"
            onClick={() => setFiltrosMobile(true)}
          >
            <Filter size={16} /> Filtrar
          </button>
          {esAdmin && (
            <>
              <button className="btn-secondary">
                <Download size={16} /> Exportar
              </button>
              <button className="btn-primary" onClick={() => navigate('/reservas/nueva')}>
                <Plus size={16} /> Nueva Reserva
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card p-4 hidden lg:block">
        <FiltrosPanel filtros={filtros} onChange={setFiltros} onBuscar={handleBuscar} />
      </div>

      {filtrosMobile && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltrosMobile(false)} />
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
              <span className="font-semibold">Filtros</span>
              <button onClick={() => setFiltrosMobile(false)}><X size={18} /></button>
            </div>
            <FiltrosPanel
              filtros={filtros}
              onChange={setFiltros}
              onBuscar={() => { handleBuscar(); setFiltrosMobile(false) }}
              compact
            />
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <TablaReservas
          reservas={reservas}
          cargando={cargando}
          esAdmin={esAdmin}
          onCancelar={handleCancelar}
          page={page}
          pages={pages}
          onPageChange={setPage}
        />
      </div>

      {esAdmin && (
        <button
          onClick={() => navigate('/reservas/nueva')}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#C8171E] hover:bg-[#a01016] text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-colors"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
