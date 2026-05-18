import axiosInstance from './axiosInstance'

export const getHistorial = (params) =>
  axiosInstance.get('/historial', { params })
