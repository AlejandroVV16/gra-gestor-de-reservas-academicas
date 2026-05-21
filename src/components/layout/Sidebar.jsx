import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, BookOpen, Building2,
  Users, History, BarChart2, X, ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../resources/escudo-unilibre.png.png'

const NAV_ADMIN = [
  { to: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/reservas',   label: 'Reservas',       icon: BookOpen        },
  { to: '/calendario', label: 'Calendario',     icon: CalendarDays    },
  { to: '/auditorios', label: 'Auditorios',     icon: Building2       },
  { to: '/personal',   label: 'Personal',       icon: Users           },
  { to: '/historial',  label: 'Historial',      icon: History         },
  { to: '/reportes',              label: 'Reportes',          icon: BarChart2    },
  { to: '/solicitudes-externas', label: 'Ext. Solicitudes',  icon: ExternalLink },
]

const NAV_TI = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/reservas',   label: 'Reservas',   icon: BookOpen        },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays    },
]

function LogoUL() {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-5 pb-4 px-3">
      {/* Escudo oficial Universidad Libre */}
      <img
        src={escudo}
        alt="Escudo Universidad Libre"
        className="w-[72px] h-[72px] object-contain drop-shadow-lg"
      />

      {/* Textos debajo del escudo */}
      <div className="text-center">
        <p className="text-white font-bold text-[11px] leading-snug tracking-wide">
          Universidad Libre
        </p>
        <p className="text-[#C8A84B] text-[10px] leading-tight font-medium tracking-widest uppercase">
          Seccional Pereira
        </p>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const { esAdmin } = useAuth()
  const nav = esAdmin ? NAV_ADMIN : NAV_TI

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/*
        CORRECCIÓN 1 — Sidebar siempre fixed, siempre h-screen.
        Eliminamos lg:static porque convertía el aside en elemento
        estático cuya altura dependía del padre con min-h-screen
        (altura indefinida). Ahora es siempre fixed top-0 → bottom-0.
        En desktop siempre visible (translate-x-0); en móvil se
        desliza con la clase de transformación según prop `open`.
      */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-[240px] bg-[#111111] z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Botón cerrar móvil */}
        <button
          className="lg:hidden absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <LogoUL />

        {/* Separador dorado */}
        <div className="mx-4 h-px bg-[#C8A84B] mb-3" />

        {/* Navegación */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#C8171E] text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-gray-600 text-center">GRA v0.1 · Prototipo</p>
        </div>
      </aside>
    </>
  )
}
