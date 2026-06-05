import axiosInstance from './axiosInstance'

export const getResumen = (params) =>
  axiosInstance.get('/api/reports/summary', { params })

export const exportarReporte = (params) =>
  axiosInstance.get('/api/reports/export', { params, responseType: 'blob' })

export const limpiarDatos = () =>
  axiosInstance.delete('/api/reports/clear')
