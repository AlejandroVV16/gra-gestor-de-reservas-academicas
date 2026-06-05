import { createContext, useContext, useState, useCallback } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

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
    try {
      const { data } = await axiosInstance.post('/api/auth/login', { email: usuario, password: contrasena })
      const roleMap = { admin: 'ADMINISTRADOR', interno: 'PERSONAL_TI' }
      const userData = {
        id: data.user_id,
        nombre: data.full_name,
        apellido: '',
        rol: roleMap[data.user_type] || 'PERSONAL_TI',
        usuario: usuario,
      }
      localStorage.setItem('gra_token', data.token)
      localStorage.setItem('gra_user', JSON.stringify(userData))
      setUser(userData)
      return { ok: true, rol: userData.rol }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error de conexión con el servidor'
      return { ok: false, mensaje: msg }
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
