import axiosInstance from './axiosInstance'

export const getHistorial = (params) =>
  axiosInstance.get('/api/history', { params })

export const limpiarHistorial = () =>
  axiosInstance.delete('/api/history')
