import axiosInstance from './axiosInstance'

export const getUsuarios = () =>
  axiosInstance.get('/api/users')

export const getPersonalTI = () =>
  axiosInstance.get('/api/users/personal-ti')

export const crearUsuario = (data) =>
  axiosInstance.post('/api/users', data)

export const editarUsuario = (id, data) =>
  axiosInstance.put(`/api/users/${id}`, data)
