import { useNavigate } from 'react-router-dom'
import { LogIn, ExternalLink, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import escudo from '../resources/escudo-unilibre.png.png'
import fondoPrincipal from '../resources/fondos de pantalla-login/principal.webp'

export default function Homepage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={fondoPrincipal} alt="" aria-hidden className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/60 via-[#111111]/80 to-[#111111]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center mb-6 ring-2 ring-[#C8A84B]/30">
          <img src={escudo} alt="Universidad Libre" className="w-20 h-20 object-contain" />
        </div>

        <h1 className="text-white font-bold text-3xl text-center leading-tight">
          Universidad Libre
        </h1>
        <p className="text-[#C8A84B] font-medium text-sm tracking-widest uppercase mt-1">
          Seccional Pereira
        </p>
        <div className="w-16 h-0.5 bg-[#C8A84B] rounded mt-4 mb-3" />
        <p className="text-gray-400 text-base text-center max-w-xs">
          Gestor de Reservas Académicas
        </p>

        <div className="mt-10 w-full max-w-xs space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-between gap-3 bg-[#C8171E] hover:bg-[#a01016] text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-150 group"
          >
            <span className="flex items-center gap-3">
              <LogIn size={20} />
              Iniciar sesión
            </span>
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/solicitud-externa')}
            className="w-full flex items-center justify-between gap-3 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-xl border border-white/20 transition-colors duration-150 group"
          >
            <span className="flex items-center gap-3">
              <ExternalLink size={20} />
              Solicitud externa
            </span>
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="absolute bottom-8 text-center">
          <p className="text-gray-600 text-xs max-w-xs mx-auto leading-relaxed">
            Universidad Libre de Colombia es acreditada de alta calidad.
            <br />
            <em className="text-gray-500">¡El conocimiento es experiencia de libertad!</em>
          </p>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-[#C8A84B] z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C8A84B] z-10" />
    </div>
  )
}
