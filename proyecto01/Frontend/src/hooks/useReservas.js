import { useState, useEffect, useCallback } from 'react'
import { getReservas } from '../api/reservasApi'

function mapReserva(r) {
  const start = new Date(r.event_start)
  const end = new Date(r.event_end)
  const fmt = (d) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  return {
    id: r.id,
    horaInicio: fmt(start),
    horaFin: fmt(end),
    fecha: r.request_date,
    encargado: r.responsible_person,
    facultad: '',
    auditorio: r.auditorium_name || 'Sin nombre',
    evento: r.event_name,
    personas: r.attendees_count,
    personalTI: [],
    estado: r.status === 'pendiente' ? 'PENDIENTE'
          : r.status === 'aprobada' ? 'CONFIRMADA'
          : r.status === 'cancelada' ? 'CANCELADA'
          : r.status === 'rechazada' ? 'RECHAZADA'
          : r.status,
  }
}

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
      setReservas(data.data.map(mapReserva))
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar reservas')
    } finally {
      setCargando(false)
    }
  }, [page]) // eslint-disable-line

  useEffect(() => { cargar() }, [page]) // eslint-disable-line

  return { reservas, total, page, pages, setPage, cargando, error, recargar: cargar }
}
