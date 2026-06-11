import { useState, useEffect, useCallback } from 'react'
import { getEquiposAll } from '../api/equiposApi'

export function useEquipos() {
  const [equipos, setEquipos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await getEquiposAll()
      setEquipos(
        data.map((e) => ({
          id: e.id,
          nombre: e.name,
          cantidad: e.quantity,
          descripcion: e.description || '',
          estado: e.is_active ? 'ACTIVO' : 'INACTIVO',
        }))
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar equipos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { equipos, cargando, error, recargar: cargar }
}
