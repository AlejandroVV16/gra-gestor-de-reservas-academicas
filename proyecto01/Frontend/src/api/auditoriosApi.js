import axiosInstance from './axiosInstance'

export const getAuditorios = () =>
  axiosInstance.get('/api/auditoriums')

export const getAuditoriosAll = () =>
  axiosInstance.get('/api/auditoriums?incluirInactivos=true')

export const getAuditoriosActivos = () =>
  axiosInstance.get('/api/auditoriums/active')

export const crearAuditorio = (data) =>
  axiosInstance.post('/api/auditoriums', data)

export const editarAuditorio = (id, data) =>
  axiosInstance.put(`/api/auditoriums/${id}`, data)

export const getDisponibilidad = (id, params) =>
  axiosInstance.get(`/api/auditoriums/${id}/availability`, { params })

export const getHorario = (id, fecha) =>
  axiosInstance.get(`/api/auditoriums/${id}/schedule`, { params: { fecha } })
