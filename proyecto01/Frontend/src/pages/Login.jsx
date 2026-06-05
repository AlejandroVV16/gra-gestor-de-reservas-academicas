import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import escudo from '../resources/escudo-unilibre.png.png'

// Imágenes de fondo en secuencia — formato WebP para menor peso
import fondoPrincipal    from '../resources/fondos de pantalla-login/principal.webp'
import fondoBenjamin     from '../resources/fondos de pantalla-login/benjamin herrera.webp'
import fondoRodrigo      from '../resources/fondos de pantalla-login/Rodrigo_Rivera.webp'

const FONDOS = [fondoPrincipal, fondoBenjamin, fondoRodrigo]
const INTERVALO_MS  = 60_000  // 60 segundos entre cambios
const FADE_MS       = 1_500   // 1.5 s de transición de fundido

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ usuario: '', contrasena: '' })
  const [verContrasena, setVerContrasena] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Índice de la imagen activa en el slideshow
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % FONDOS.length)
    }, INTERVALO_MS)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (e) => {
    setError('')
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.usuario.trim() || !form.contrasena.trim()) {
      setError('Completa todos los campos')
      return
    }
    setCargando(true)
    const res = await login(form.usuario.trim(), form.contrasena)
    setCargando(false)
    if (res.ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(res.mensaje || 'Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-[#111111]">

      {/* ── SLIDESHOW DE FONDO ─────────────────────────────────────────
          Las 3 imágenes están apiladas con position:absolute.
          Solo la imagen activa (bgIndex) tiene opacity-100;
          las demás tienen opacity-0.
          transition-opacity duration-[1500ms] produce el crossfade.
          El orden de z-index garantiza que la nueva imagen se muestra
          encima mientras la anterior desaparece.
      ────────────────────────────────────────────────────────────── */}
      {FONDOS.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          aria-hidden
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity ease-in-out
            pointer-events-none select-none
          `}
          style={{
            transitionDuration: `${FADE_MS}ms`,
            opacity: i === bgIndex ? 1 : 0,
            zIndex:  i === bgIndex ? 1 : 0,
          }}
        />
      ))}

      {/* Overlay negro al 82 % → las imágenes se perciben al ~18 %
          mantiene los tonos oscuros institucionales del login */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)', zIndex: 2 }}
        aria-hidden
      />

      {/* Indicadores de imagen activa (puntos) — z-index 10 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 10 }}>
        {FONDOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setBgIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === bgIndex
                ? 'w-5 h-2 bg-[#C8A84B]'
                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Imagen de fondo ${i + 1}`}
          />
        ))}
      </div>

      {/* Franja dorada superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#C8A84B]" style={{ zIndex: 10 }} />

      {/* Contenido del formulario — z-index 20, por encima del overlay (z:2) */}
      <div className="relative w-full max-w-sm" style={{ zIndex: 20 }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* Escudo oficial — imagen real de la Universidad Libre */}
          <img
            src={escudo}
            alt="Escudo Universidad Libre"
            className="w-28 h-28 object-contain drop-shadow-2xl mb-3"
          />
          <h1 className="text-white font-bold text-xl text-center leading-tight">
            Universidad Libre
          </h1>
          <p className="text-gray-400 text-sm text-center">Seccional Pereira</p>
          <div className="mt-3 w-12 h-0.5 bg-[#C8A84B] rounded" />
          <p className="text-gray-300 text-sm mt-3 font-medium">
            Gestor de Reservas Académicas
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-2xl p-8 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute top-3 left-3 flex items-center gap-1 text-xs text-gray-400 hover:text-[#C8171E] transition"
          >
            <ArrowLeft size={14} /> Volver
          </button>
          <h2 className="text-[#111111] font-bold text-lg mb-6">Iniciar sesión</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={16} className="text-[#C8171E] flex-shrink-0" />
              <p className="text-sm text-[#C8171E]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Usuario institucional</label>
              <input
                type="text"
                name="usuario"
                value={form.usuario}
                onChange={handleChange}
                className="input-field"
                placeholder="usuario"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="label-field">Contraseña</label>
              <div className="relative">
                <input
                  type={verContrasena ? 'text' : 'password'}
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setVerContrasena((v) => !v)}
                >
                  {verContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#C8171E] hover:bg-[#a01016] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 mt-2"
            >
              {cargando ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Hint credenciales demo */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-[#E0E0E0]">
            <p className="text-xs text-gray-500 font-medium mb-1">Demo (prototipo):</p>
            <p className="text-xs text-gray-400">Admin: <span className="font-mono font-semibold text-gray-600">lindelia / 1234</span></p>
            <p className="text-xs text-gray-400">TI: <span className="font-mono font-semibold text-gray-600">johns / 1234</span></p>
          </div>
        </div>

        {/* Tagline institucional */}
        <p className="text-gray-600 text-xs text-center mt-6 max-w-xs mx-auto leading-relaxed">
          Universidad Libre de Colombia es acreditada de alta calidad.
          <br />
          <em>¡El conocimiento es experiencia de libertad!</em>
        </p>
      </div>

      {/* Franja dorada inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C8A84B]" style={{ zIndex: 10 }} />
    </div>
  )
}
