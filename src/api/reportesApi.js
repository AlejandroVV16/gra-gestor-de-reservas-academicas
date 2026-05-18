import axiosInstance from './axiosInstance'

export const getResumen = (params) =>
  axiosInstance.get('/reportes/resumen', { params })

export const exportarReporte = (params) =>
  axiosInstance.get('/reportes/exportar', { params, responseType: 'blob' })
