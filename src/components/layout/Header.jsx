import { Menu, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import RolBadge from '../ui/RolBadge'

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    /*
      CORRECCIÓN 2 — Header siempre visible:
      · z-30: por encima del contenido pero sin bloquear el sidebar (z-40)
      · left-0 en móvil / left-[240px] en desktop (sidebar siempre fixed)
      · right-0 explícito para que el header llene el ancho restante
      · overflow-visible para que los dropdowns/badges no se corten
      · flex-shrink-0 en la zona de acciones para que nunca se comprima
    */
    <header className="
      fixed top-0 right-0 left-0 lg:left-[240px]
      h-16 z-30
      bg-white border-b border-[#E0E0E0] shadow-sm
      flex items-center justify-between
      px-4 lg:px-6
      overflow-visible
    ">
      {/* Hamburger — solo móvil */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0"
        onClick={onMenuToggle}
      >
        <Menu size={22} />
      </button>

      {/* Título — desktop */}
      <div className="hidden lg:flex items-center gap-2 min-w-0">
        <div className="w-1 h-6 bg-[#C8171E] rounded-full flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Gestor de Reservas Académicas
        </span>
      </div>

      {/* Acciones derecha — flex-shrink-0 para que nunca se compriman */}
      <div className="flex items-center gap-2 lg:gap-3 ml-auto flex-shrink-0">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E0E0E0]">
          <Avatar nombre={user?.nombre || ''} apellido={user?.apellido || ''} size="md" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight whitespace-nowrap">
              {user?.nombre} {user?.apellido}
            </p>
            <RolBadge rol={user?.rol} />
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-[#C8171E] transition-colors flex-shrink-0"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
