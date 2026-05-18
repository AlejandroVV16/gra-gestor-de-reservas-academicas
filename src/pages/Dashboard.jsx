import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Building2, AlertTriangle, Zap, Plus, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import KpiCard from '../components/ui/KpiCard'
import EstadoBadge from '../components/ui/EstadoBadge'
import { MOCK_RESERVAS } from '../data/mockData'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

// Mini-calendario semana actual
function MiniCalendario() {
  const [seleccionado, setSeleccionado] = useState(new Date())
  const hoy = new Date()
  const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 })
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i))
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">Semana actual</p>
      <div className="grid grid-cols-7 gap-1">
        {labels.map((l, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 pb-1">{l}</div>
        ))}
        {dias.map((dia, i) => {
          const tieneEvento = MOCK_RESERVAS.some((r) => r.fecha === format(dia, 'yyyy-MM-dd'))
          const esHoy = isSameDay(dia, hoy)
          const esSel = isSameDay(dia, seleccionado)
          return (
            <button
              key={i}
              onClick={() => setSeleccionado(dia)}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg text-sm transition-colors ${
                esSel ? 'bg-[#C8171E] text-white' :
                esHoy ? 'bg-[#C8171E]/10 text-[#C8171E] font-bold' :
                'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {format(dia, 'd')}
              {tieneEvento && !esSel && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-[#C8A84B] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Tabla próximas reservas (hoy + mañana)
function TablaProximas({ reservas, esAdmin }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            {['Hora', 'Evento', 'Auditorio', 'Estado'].map((col) => (
              <th key={col} className="px-3 py-2.5 text-left">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservas.slice(0, 6).map((r, i) => (
            <tr key={r.id} className={`border-b border-[#E0E0E0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
              <td className="px-3 py-2.5 font-medium whitespace-nowrap">{r.horaInicio}</td>
              <td className="px-3 py-2.5 max-w-[160px] truncate">{r.evento}</td>
              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.auditorio.replace('Benjamín Herrera', 'B. Herrera').replace('Rodrigo Rivera', 'R. Rivera')}</td>
              <td className="px-3 py-2.5"><EstadoBadge estado={r.estado} /></td>
            </tr>
          ))}
          {reservas.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-sm">
                No hay reservas para hoy ni mañana
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {
  const { esAdmin, esPersonalTI } = useAuth()
  const navigate = useNavigate()

  const hoy = format(new Date(), 'yyyy-MM-dd')
  const manana = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const proximasReservas = MOCK_RESERVAS.filter((r) => r.fecha === hoy || r.fecha === manana)
  const reservasHoy = MOCK_RESERVAS.filter((r) => r.fecha === hoy)
  const conflictos = MOCK_RESERVAS.filter((r) => r.estado === 'CONFLICTO')

  return (
    <div className="space-y-5">
      {/* Banner Personal TI */}
      {esPersonalTI && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Modo de solo consulta.</strong> Tienes acceso de solo lectura a las reservas.
            Para solicitar cambios, contacta a la administradora.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titulo="Reservas Hoy"
          valor={reservasHoy.length}
          subtitulo="Highlights"
          icono={CalendarDays}
          color="#C8171E"
        />
        <KpiCard
          titulo="Auditorios Ocupados"
          valor={15}
          subtitulo="Auditorios"
          icono={Building2}
          color="#374151"
        />
        <KpiCard
          titulo="Conflictos Detectados"
          valor={conflictos.length}
          subtitulo="Alertas"
          icono={AlertTriangle}
          color={conflictos.length > 0 ? '#C8171E' : '#16a34a'}
        />
        <KpiCard
          titulo="Eventos Esta Semana"
          valor={MOCK_RESERVAS.length}
          subtitulo="Esta Semana"
          icono={Zap}
          color="#C8A84B"
        />
      </div>

      {/* Cuerpo dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Mini calendario */}
        <div className="card p-5 lg:col-span-2">
          <MiniCalendario />
        </div>

        {/* Tabla próximas reservas */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="px-5 py-4 border-b border-[#E0E0E0]">
            <h2 className="font-semibold text-gray-800">Próximas reservas (Hoy y Mañana)</h2>
          </div>
          <TablaProximas reservas={proximasReservas} esAdmin={esAdmin} />
          {proximasReservas.length > 0 && (
            <div className="px-4 py-3 border-t border-[#E0E0E0]">
              <button
                onClick={() => navigate('/reservas')}
                className="text-sm text-[#C8171E] hover:text-[#a01016] font-medium"
              >
                Ver todas las reservas →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Acceso rápido Admin */}
      {esAdmin && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Acceso rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nueva Reserva',  path: '/reservas/nueva',  color: '#C8171E' },
              { label: 'Ver Auditorios', path: '/auditorios',       color: '#374151' },
              { label: 'Gestionar Personal', path: '/personal',     color: '#1d4ed8' },
              { label: 'Ver Reportes',   path: '/reportes',         color: '#C8A84B' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#E0E0E0] hover:border-current font-medium text-sm transition-colors"
                style={{ color: item.color }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB nueva reserva — solo Admin */}
      {esAdmin && (
        <button
          onClick={() => navigate('/reservas/nueva')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#C8171E] hover:bg-[#a01016] text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-colors"
          title="Nueva Reserva"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
