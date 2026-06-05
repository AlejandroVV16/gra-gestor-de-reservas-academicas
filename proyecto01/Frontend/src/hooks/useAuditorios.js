import { useState, useEffect, useCallback } from 'react'
import { getAuditoriosAll } from '../api/auditoriosApi'

const SEDE_MAP = {
  'Sede Belmonte': 'BELMONTE',
  'Sede Centro': 'CENTRO',
}

function mapAuditorio(a) {
  return {
    id: a.id,
    nombre: a.name,
    sede: SEDE_MAP[a.location] || a.location,
    capacidad: a.capacity,
    descripcion: a.description || '',
    estado: a.is_active ? 'ACTIVO' : 'INACTIVO',
    equipamiento: [],
  }
}

export function useAuditorios() {
  const [auditorios, setAuditorios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await getAuditoriosAll()
      setAuditorios(data.map(mapAuditorio))
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar auditorios')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { auditorios, cargando, error, recargar: cargar }
}
