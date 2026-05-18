import axiosInstance from './axiosInstance'

export const getReservas = (params) =>
  axiosInstance.get('/reservas', { params })

export const getReserva = (id) =>
  axiosInstance.get(`/reservas/${id}`)

export const crearReserva = (data) =>
  axiosInstance.post('/reservas', data)

export const editarReserva = (id, data) =>
  axiosInstance.put(`/reservas/${id}`, data)

export const cancelarReserva = (id) =>
  axiosInstance.delete(`/reservas/${id}`)

export const getHistorialReserva = (id) =>
  axiosInstance.get(`/reservas/${id}/historial`)
