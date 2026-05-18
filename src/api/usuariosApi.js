import axiosInstance from './axiosInstance'

export const getUsuarios = () =>
  axiosInstance.get('/usuarios')

export const crearUsuario = (data) =>
  axiosInstance.post('/usuarios', data)

export const editarUsuario = (id, data) =>
  axiosInstance.put(`/usuarios/${id}`, data)
