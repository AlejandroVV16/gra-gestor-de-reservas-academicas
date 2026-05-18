import { createContext, useContext, useState, useCallback } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

// Datos mock para prototipo (se eliminan cuando el backend esté listo)
const MOCK_USERS = [
  { id: 1, nombre: 'Lindelia', apellido: 'Administradora', usuario: 'lindelia', rol: 'ADMINISTRADOR', contrasena: '1234' },
  { id: 2, nombre: 'Johns',    apellido: 'Betancur',       usuario: 'johns',    rol: 'PERSONAL_TI',   contrasena: '1234' },
  { id: 3, nombre: 'Alex',     apellido: 'Bedoya',         usuario: 'alex',     rol: 'PERSONAL_TI',   contrasena: '1234' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gra_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (usuario, contrasena) => {
    // Intentar con el backend real primero
    try {
      const { data } = await axiosInstance.post('/auth/login', { usuario, contrasena })
      localStorage.setItem('gra_token', data.token)
      localStorage.setItem('gra_user', JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true, rol: data.user.rol }
    } catch {
      // Fallback mock para prototipo
      const found = MOCK_USERS.find(
        (u) => u.usuario === usuario && u.contrasena === contrasena
      )
      if (found) {
        const mockUser = { id: found.id, nombre: found.nombre, apellido: found.apellido, rol: found.rol, usuario: found.usuario }
        localStorage.setItem('gra_token', 'mock-jwt-token')
        localStorage.setItem('gra_user', JSON.stringify(mockUser))
        setUser(mockUser)
        return { ok: true, rol: mockUser.rol }
      }
      return { ok: false, mensaje: 'Usuario o contraseña incorrectos' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gra_token')
    localStorage.removeItem('gra_user')
    setUser(null)
  }, [])

  const esAdmin = user?.rol === 'ADMINISTRADOR'
  const esPersonalTI = user?.rol === 'PERSONAL_TI'

  return (
    <AuthContext.Provider value={{ user, login, logout, esAdmin, esPersonalTI }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
