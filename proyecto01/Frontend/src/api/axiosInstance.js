import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Adjuntar JWT a cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gra_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Redirigir a /login si el token expiró
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gra_token')
      localStorage.removeItem('gra_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
