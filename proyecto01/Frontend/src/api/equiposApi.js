import axiosInstance from './axiosInstance'

export const getEquipos = () =>
  axiosInstance.get('/api/equipments')

export const getEquiposAll = () =>
  axiosInstance.get('/api/equipments?incluirInactivos=true')

export const crearEquipo = (data) =>
  axiosInstance.post('/api/equipments', data)

export const editarEquipo = (id, data) =>
  axiosInstance.put(`/api/equipments/${id}`, data)

export const getEquiposActivos = () =>
  axiosInstance.get('/api/equipments/active')
