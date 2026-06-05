import axiosInstance from './axiosInstance'

export const getReservas = (params) =>
  axiosInstance.get('/api/reservations', { params })

export const getReserva = (id) =>
  axiosInstance.get(`/api/reservations/${id}`)

export const crearReserva = (data) =>
  axiosInstance.post('/api/reservations', data)

export const editarReserva = (id, data) =>
  axiosInstance.put(`/api/reservations/${id}`, data)

export const cancelarReserva = (id) =>
  axiosInstance.patch(`/api/reservations/${id}/cancel`)

export const getHistorialReserva = (id) =>
  axiosInstance.get(`/api/reservations/${id}/history`)
