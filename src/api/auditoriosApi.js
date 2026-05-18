import axiosInstance from './axiosInstance'

export const getAuditorios = () =>
  axiosInstance.get('/auditorios')

export const crearAuditorio = (data) =>
  axiosInstance.post('/auditorios', data)

export const editarAuditorio = (id, data) =>
  axiosInstance.put(`/auditorios/${id}`, data)

export const getDisponibilidad = (id, params) =>
  axiosInstance.get(`/auditorios/${id}/disponibilidad`, { params })
