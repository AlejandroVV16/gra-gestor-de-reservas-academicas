import { useState, useEffect, useCallback } from 'react'
import { getReservas } from '../api/reservasApi'
import { MOCK_RESERVAS } from '../data/mockData'

export function useReservas(filtros = {}) {
  const [reservas, setReservas] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const cargar = useCallback(async (params = {}) => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await getReservas({ ...filtros, ...params, page })
      setReservas(data.data)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      // Fallback mock
      setReservas(MOCK_RESERVAS)
      setTotal(MOCK_RESERVAS.length)
      setPages(1)
    } finally {
      setCargando(false)
    }
  }, [page]) // eslint-disable-line

  useEffect(() => { cargar() }, [page]) // eslint-disable-line

  return { reservas, total, page, pages, setPage, cargando, error, recargar: cargar }
}
