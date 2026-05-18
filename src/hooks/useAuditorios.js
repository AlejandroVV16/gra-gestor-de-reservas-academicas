import { useState, useEffect } from 'react'
import { getAuditorios } from '../api/auditoriosApi'
import { MOCK_AUDITORIOS } from '../data/mockData'

export function useAuditorios() {
  const [auditorios, setAuditorios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await getAuditorios()
      setAuditorios(data)
    } catch {
      setAuditorios(MOCK_AUDITORIOS)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  return { auditorios, cargando, error, recargar: cargar }
}
